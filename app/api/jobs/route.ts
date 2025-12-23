import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendNotification } from "@/lib/notifications";
import { calculateServiceCommission } from "@/lib/services/commission-calculator";
import { isPaymentLocked, filterDealerInfoForTechnician } from "@/lib/services/job-privacy";

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// POST - Create a new job post
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a dealer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { dealer: true },
    });

    if (!user || user.role !== "DEALER" || !user.dealer) {
      return NextResponse.json(
        { error: "Only approved dealers can post jobs" },
        { status: 403 }
      );
    }

    if (user.dealer.accountStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Your dealer account is not approved yet" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const {
      title,
      description,
      workDetails,
      customerName,
      customerPhone,
      customerEmail,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      placeName,
      serviceCategoryId,
      serviceSubCategoryId,
      serviceDomainId,
      skillId,
      priority = "NORMAL",
      scheduledAt,
      estimatedDuration,
      estimatedCost,
      notes,
    } = data;

    // Validate required fields
    if (!title || !description || !workDetails || !customerName || !customerPhone || 
        !address || !city || !state || !pincode || !serviceCategoryId || 
        !serviceSubCategoryId || !serviceDomainId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch service category and subcategory to get warranty days
    const [serviceCategory, serviceSubCategory] = await Promise.all([
      prisma.serviceCategory.findUnique({
        where: { id: serviceCategoryId },
        select: { warrantyDays: true },
      }),
      prisma.serviceSubCategory.findUnique({
        where: { id: serviceSubCategoryId },
        select: { warrantyDays: true },
      }),
    ]);

    // Determine warranty days: subcategory warranty takes precedence, then category warranty
    const warrantyDays = serviceSubCategory?.warrantyDays ?? serviceCategory?.warrantyDays ?? null;

    // Generate unique job number
    const jobNumber = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create job post
    const jobPost = await prisma.jobPost.create({
      data: {
        jobNumber,
        dealerId: user.id,
        dealerName: user.dealer.fullName || user.name || "Dealer",
        dealerPhone: user.dealer.mobile,
        dealerEmail: user.dealer.email,
        title,
        description,
        workDetails,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        address,
        city,
        state,
        pincode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        placeName: placeName || null,
        serviceCategoryId,
        serviceSubCategoryId,
        serviceDomainId,
        skillId: skillId || null,
        priority,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        notes: notes || null,
        warrantyDays, // Set warranty days from service
        status: "PENDING",
      },
    });

    // Find matching technicians based on location and skills
    const matchingTechnicians = await findMatchingTechnicians(jobPost);

    // Send notifications to matching technicians
    if (matchingTechnicians.length > 0) {
      await sendJobNotifications(jobPost, matchingTechnicians);
    }

    return NextResponse.json({
      success: true,
      job: jobPost,
      notificationsSent: matchingTechnicians.length,
    });
  } catch (error: any) {
    console.error("Error creating job post:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create job post" },
      { status: 500 }
    );
  }
}

// GET - Fetch jobs (for dealer or technician)
export async function GET(request: NextRequest) {
  try {
    console.log(`[Jobs API] GET request received`);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log(`[Jobs API] ❌ Unauthorized - No session`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = session.user.role;
    console.log(`[Jobs API] User: ${session.user.email}, Role: ${role}, Status: ${status}`);

    let where: any = {};

    if (role === "DEALER") {
      // Dealers see their own jobs
      where.dealerId = session.user.id;
    } else if (role === "TECHNICIAN") {
      // Technicians see jobs assigned to them or available jobs
      const technician = await prisma.technician.findUnique({
        where: { userId: session.user.id },
      });

      if (technician) {
        if (status === "available") {
          // Show available jobs matching their skills and location
          // For MongoDB, we need to handle null/undefined differently
          // Try fetching all PENDING jobs first, then filter in memory for null assignedTechnicianId
          where.status = "PENDING";
          // Don't filter by assignedTechnicianId in Prisma query - we'll filter in memory
          
          console.log(`[Jobs API] Query filter: status=PENDING (will filter assignedTechnicianId in memory)`);
          
          // Filter jobs based on technician's location and skills
          // We'll filter in memory after fetching, as Prisma doesn't support complex location/skill matching
        } else {
          // Show assigned jobs
          where.assignedTechnicianId = technician.id;
          console.log(`[Jobs API] Query filter: assignedTechnicianId=${technician.id}`);
        }
      } else {
        return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
      }
    } else if (role === "ADMIN") {
      // Admins see all jobs
      // No additional where clause
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (status && status !== "available") {
      where.status = status;
    }

    // Debug: Check total jobs in database
    const totalJobsCount = await prisma.jobPost.count({});
    const pendingJobsCount = await prisma.jobPost.count({ where: { status: "PENDING" } });
    const unassignedJobsCount = await prisma.jobPost.count({ where: { status: "PENDING", assignedTechnicianId: null } });
    console.log(`[Jobs API] Database stats - Total: ${totalJobsCount}, PENDING: ${pendingJobsCount}, PENDING+Unassigned: ${unassignedJobsCount}`);
    console.log(`[Jobs API] Query where clause:`, JSON.stringify(where, null, 2));

    let jobs = await prisma.jobPost.findMany({
      where,
      include: {
        dealer: {
          include: {
            dealer: true, // Include Dealer profile
          },
        },
        technician: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    console.log(`[Jobs API] Jobs fetched with filter: ${jobs.length}`);
    
    // Filter out assigned jobs in memory (for MongoDB compatibility)
    if (role === "TECHNICIAN" && status === "available") {
      const beforeCount = jobs.length;
      jobs = jobs.filter(job => !job.assignedTechnicianId);
      console.log(`[Jobs API] Filtered to ${jobs.length} unassigned jobs (from ${beforeCount} total PENDING jobs)`);
    }
    
    // Log specific job if searching for it
    if (jobs.length > 0) {
      const specificJob = jobs.find(j => j.jobNumber === 'JOB-1766410892236-NXI2Y821A');
      if (specificJob) {
        console.log(`[Jobs API] ✅ Found specific job in results: ${specificJob.jobNumber}`);
      }
    } else {
      // Check if the job exists with different status
      const jobExists = await prisma.jobPost.findFirst({
        where: { jobNumber: 'JOB-1766410892236-NXI2Y821A' },
        select: { jobNumber: true, status: true, assignedTechnicianId: true },
      });
      if (jobExists) {
        console.log(`[Jobs API] ⚠️ Job JOB-1766410892236-NXI2Y821A exists but doesn't match filter - Status: ${jobExists.status}, Assigned: ${jobExists.assignedTechnicianId ? 'YES' : 'NO'}`);
      } else {
        console.log(`[Jobs API] ❌ Job JOB-1766410892236-NXI2Y821A not found in database`);
      }
    }

    // If technician is requesting available jobs, filter by location and skills
    if (role === "TECHNICIAN" && status === "available") {
      console.log(`[Jobs API] Technician requesting available jobs`);
      const technician = await prisma.technician.findUnique({
        where: { userId: session.user.id },
      });

      if (!technician) {
        console.log(`[Jobs API] ❌ Technician profile not found`);
        return NextResponse.json({ jobs: [] });
      }

      // Parse technician skills first (before using it)
      let technicianSkills: any[] = [];
      if (technician.primarySkills) {
        try {
          technicianSkills = typeof technician.primarySkills === 'string' 
            ? JSON.parse(technician.primarySkills) 
            : technician.primarySkills;
          if (!Array.isArray(technicianSkills)) {
            technicianSkills = [];
          }
        } catch (e) {
          console.error("[Jobs API] Error parsing technician primary skills:", e);
          technicianSkills = [];
        }
      }
      
      console.log(`[Jobs API] ✅ Technician found: ${technician.fullName} (${technician.email || technician.mobile || 'no contact'})`);
      console.log(`[Jobs API] Technician details - Location: lat=${technician.latitude}, lng=${technician.longitude}, radius=${technician.serviceRadiusKm}km, place=${technician.placeName}`);
      console.log(`[Jobs API] Technician skills count: ${technicianSkills.length}, categories: ${technician.serviceCategories?.length || 0}`);
      console.log(`[Jobs API] Total jobs before filtering: ${jobs.length}`);
      
      // Log specific job if it exists
      const specificJob = jobs.find(j => j.jobNumber === 'JOB-1766410892236-NXI2Y821A');
      if (specificJob) {
        console.log(`[Jobs API] 🔍 Found specific job JOB-1766410892236-NXI2Y821A - Location: lat=${specificJob.latitude}, lng=${specificJob.longitude}, City: ${specificJob.city}, DomainId: ${specificJob.serviceDomainId}, SkillId: ${specificJob.skillId}`);
      }

      // TEMPORARY: For testing, show all jobs if technician has no location/skills
      // This helps debug the issue
      const hasLocation = technician.latitude && technician.longitude;
      const hasSkills = technicianSkills.length > 0;
      
      if (!hasLocation && !hasSkills) {
        console.log(`[Jobs API] ⚠️ Technician has no location or skills - showing ALL jobs for testing`);
        return NextResponse.json({ jobs });
      }
      if (technician.primarySkills) {
        try {
          technicianSkills = typeof technician.primarySkills === 'string' 
            ? JSON.parse(technician.primarySkills) 
            : technician.primarySkills;
          if (!Array.isArray(technicianSkills)) {
            technicianSkills = [];
          }
        } catch (e) {
          console.error("[Jobs API] Error parsing technician primary skills:", e);
          technicianSkills = [];
        }
      }

      // Get all domain IDs that technician has skills in
      const technicianSkillIds = technicianSkills.map((ps: any) => ps.skillId).filter(Boolean);
      
      // Fetch all service domains and categories in one batch to avoid N+1 queries
      const allDomainIds = [...new Set(jobs.map(j => j.serviceDomainId).filter(Boolean))];
      const allCategoryIds = [...new Set(jobs.map(j => j.serviceCategoryId).filter(Boolean))];
      
      const domainSkillsMap = new Map();
      const domainsMap = new Map(); // Cache for service domains
      const categoriesMap = new Map(); // Cache for service categories
      
      // Fetch all service domains
      if (allDomainIds.length > 0) {
        const allDomains = await prisma.serviceDomain.findMany({
          where: { id: { in: allDomainIds } },
          select: { id: true, title: true },
        });
        allDomains.forEach((domain) => {
          domainsMap.set(domain.id, domain);
        });
        
        const allDomainSkills = await prisma.skill.findMany({
          where: {
            serviceDomainId: { in: allDomainIds },
            active: true,
          },
          select: {
            id: true,
            title: true,
            serviceDomainId: true,
          },
        });

        // Group skills by domain
        allDomainSkills.forEach((skill) => {
          if (!domainSkillsMap.has(skill.serviceDomainId)) {
            domainSkillsMap.set(skill.serviceDomainId, []);
          }
          domainSkillsMap.get(skill.serviceDomainId).push(skill);
        });
      }
      
      // Fetch all service categories
      if (allCategoryIds.length > 0) {
        const allCategories = await prisma.serviceCategory.findMany({
          where: { id: { in: allCategoryIds } },
          select: { id: true, title: true },
        });
        allCategories.forEach((category) => {
          categoriesMap.set(category.id, category);
        });
      }

      // Fetch all job skills in one query to avoid N+1 queries
      const allJobSkillIds = jobs.map(j => j.skillId).filter(Boolean);
      const jobSkillsMap = new Map();
      if (allJobSkillIds.length > 0) {
        const jobSkills = await prisma.skill.findMany({
          where: { id: { in: allJobSkillIds } },
          select: { id: true, title: true },
        });
        jobSkills.forEach((skill) => {
          jobSkillsMap.set(skill.id, skill.title);
        });
      }

      // Filter jobs using same logic as findMatchingTechnicians
      const filteredJobs = [];
      for (const job of jobs) {
        try {
          // Check location match - Same logic as findMatchingTechnicians
          let locationMatch = false;
          let locationMatchReason = "none";
          
          // Convert to numbers and validate (check for null, undefined, 0, or invalid values)
          const jobLat = typeof job.latitude === 'number' ? job.latitude : parseFloat(job.latitude as any);
          const jobLng = typeof job.longitude === 'number' ? job.longitude : parseFloat(job.longitude as any);
          const techLat = typeof technician.latitude === 'number' ? technician.latitude : parseFloat(technician.latitude as any);
          const techLng = typeof technician.longitude === 'number' ? technician.longitude : parseFloat(technician.longitude as any);
          
          const hasJobLocation = !isNaN(jobLat) && !isNaN(jobLng) && jobLat !== 0 && jobLng !== 0;
          const hasTechLocation = !isNaN(techLat) && !isNaN(techLng) && techLat !== 0 && techLng !== 0;
          
          if (hasJobLocation && hasTechLocation) {
            // Calculate distance between job and technician locations
            const distance = calculateDistance(jobLat, jobLng, techLat, techLng);
            const maxRadius = technician.serviceRadiusKm || 50; // Default 50km
            
            if (distance <= maxRadius) {
              locationMatch = true;
              locationMatchReason = `distance: ${distance.toFixed(2)}km within radius: ${maxRadius}km`;
            } else {
              locationMatchReason = `distance: ${distance.toFixed(2)}km exceeds radius: ${maxRadius}km`;
            }
            console.log(`[Jobs API] Job ${job.jobNumber} - Distance: ${distance.toFixed(2)}km, Radius: ${maxRadius}km, Match: ${locationMatch}`);
          } else if (job.city && technician.placeName) {
            // Fallback to city/place name matching
            const jobCity = job.city.toLowerCase().trim();
            const techPlace = technician.placeName.toLowerCase().trim();
            if (jobCity === techPlace) {
              locationMatch = true;
              locationMatchReason = `city match: ${job.city}`;
            } else {
              locationMatchReason = `city mismatch: "${job.city}" vs "${technician.placeName}"`;
            }
            console.log(`[Jobs API] Job ${job.jobNumber} - City: "${jobCity}" vs "${techPlace}", Match: ${locationMatch}`);
          } else if (!hasJobLocation && !hasTechLocation) {
            // If neither has location, allow match
            locationMatch = true;
            locationMatchReason = "neither has location data - allowing match";
            console.log(`[Jobs API] Job ${job.jobNumber} - No location data, allowing match`);
          } else if (!hasJobLocation) {
            // If job doesn't have location, allow match
            locationMatch = true;
            locationMatchReason = "job location not set - allowing match";
          } else if (!hasTechLocation) {
            // If technician doesn't have location but job has, check city as fallback
            if (job.city && technician.placeName) {
              const jobCity = job.city.toLowerCase().trim();
              const techPlace = technician.placeName.toLowerCase().trim();
              if (jobCity === techPlace) {
                locationMatch = true;
                locationMatchReason = `city match (tech no coordinates): ${job.city}`;
              } else {
                locationMatchReason = `tech no coordinates, city mismatch: "${job.city}" vs "${technician.placeName}"`;
              }
            } else {
              // If no city data either, allow match as fallback
              locationMatch = true;
              locationMatchReason = "technician location not set - allowing match as fallback";
            }
          }

          // Check skill match - Same logic as findMatchingTechnicians
          let skillMatch = false;
          let skillMatchReason = "none";
          
          // Method 1: Check serviceDomainId match (most important)
          if (job.serviceDomainId && !skillMatch) {
            try {
              // Use cached domain instead of database query
              const serviceDomain = domainsMap.get(job.serviceDomainId);
              
              if (serviceDomain) {
                // Check if technician's primarySkills include this domain or related skills
                if (technicianSkills.length > 0) {
                  const hasDomainSkill = technicianSkills.some((ps: any) => 
                    ps.domainId === job.serviceDomainId || 
                    ps.serviceDomainId === job.serviceDomainId ||
                    ps.domain === serviceDomain.title ||
                    ps.serviceDomain === serviceDomain.title
                  );
                  if (hasDomainSkill) {
                    skillMatch = true;
                    skillMatchReason = `primarySkills domain match: ${serviceDomain.title}`;
                  } else {
                    // Also check if any skill in this domain matches technician's skills
                    const domainSkills = domainSkillsMap.get(job.serviceDomainId) || [];
                    const hasMatchingSkill = technicianSkills.some((ps: any) => 
                      domainSkills.some((ds: any) => 
                        ds.id === ps.skillId || 
                        ds.id === ps.id ||
                        ds.title === ps.skill ||
                        (typeof ps === 'string' && ds.title === ps)
                      )
                    );
                    if (hasMatchingSkill) {
                      skillMatch = true;
                      skillMatchReason = `primarySkills matches domain skills: ${serviceDomain.title}`;
                    }
                  }
                }
                
                // Also check serviceCategories for domain-related categories
                if (!skillMatch && technician.serviceCategories && Array.isArray(technician.serviceCategories)) {
                  const domainMatch = technician.serviceCategories.some((cat: string) => 
                    cat.toLowerCase().includes(serviceDomain.title.toLowerCase()) ||
                    serviceDomain.title.toLowerCase().includes(cat.toLowerCase())
                  );
                  if (domainMatch) {
                    skillMatch = true;
                    skillMatchReason = `serviceCategories domain match: ${serviceDomain.title}`;
                  }
                }
              }
            } catch (e) {
              console.error(`[Jobs API] Error checking serviceDomain for job ${job.jobNumber}:`, e);
            }
          }

          // Method 2: Check serviceCategory match
          if (!skillMatch && job.serviceCategoryId && technician.serviceCategories && Array.isArray(technician.serviceCategories)) {
            // Use cached category instead of database query
            const serviceCategory = categoriesMap.get(job.serviceCategoryId);
            if (serviceCategory && technician.serviceCategories.includes(serviceCategory.title)) {
              skillMatch = true;
              skillMatchReason = `serviceCategory match: ${serviceCategory.title}`;
            }
          }

          // Method 3: Check specific skillId match
          if (!skillMatch && job.skillId && technicianSkills.length > 0) {
            skillMatch = technicianSkillIds.includes(job.skillId);
            if (!skillMatch) {
              // Also check by skill title
              const jobSkillTitle = jobSkillsMap.get(job.skillId);
              if (jobSkillTitle) {
                skillMatch = technicianSkills.some((ps: any) => 
                  ps.skill === jobSkillTitle || ps.skillId === job.skillId || ps.id === job.skillId
                );
                if (skillMatch) {
                  skillMatchReason = `skillId match: ${jobSkillTitle}`;
                }
              }
            } else {
              skillMatchReason = `skillId match: ${job.skillId}`;
            }
          }

          // If technician has no skills set and job has no specific skill requirement, allow match
          if (!skillMatch && technicianSkills.length === 0 && !job.skillId) {
            skillMatch = true;
            skillMatchReason = "technician has no skills, job has no skill requirement";
          }

          // Final match decision - same logic as findMatchingTechnicians
          // If job has location, require both location AND skill match
          // If job has no location, only require skill match
          const shouldMatch = hasJobLocation 
            ? (locationMatch && skillMatch)
            : skillMatch; // If job has no location, only require skill match

          if (shouldMatch) {
            filteredJobs.push(job);
            console.log(`[Jobs API] ✅ Job ${job.jobNumber} (${job.title}) - MATCHED - Location: ${locationMatchReason}, Skill: ${skillMatchReason}`);
          } else {
            console.log(`[Jobs API] ❌ Job ${job.jobNumber} (${job.title}) - REJECTED - Location: ${locationMatchReason}, Skill: ${skillMatchReason}`);
          }
        } catch (error) {
          console.error(`[Jobs API] Error filtering job ${job.jobNumber}:`, error);
          // Skip this job if there's an error
          continue;
        }
      }

      console.log(`[Jobs API] Total jobs after filtering: ${filteredJobs.length}`);
      jobs = filteredJobs;
    }

    // Transform jobs to match frontend expected format
    // For technicians, calculate and return net amount (commission-deducted)
    // Also filter dealer information based on payment status
    const transformedJobs = await Promise.all(jobs.map(async (job: any) => {
      try {
        let amount = job.finalPrice || job.estimatedCost || 0;
        
        // Check if payment is locked for this job
        let paymentLocked = false;
        try {
          paymentLocked = await isPaymentLocked(job.id);
        } catch (error) {
          console.error(`Error checking payment lock for job ${job.id}:`, error);
          // Default to false if check fails
          paymentLocked = false;
        }
        
        // For technicians viewing jobs, calculate net amount (commission-deducted)
        if (role === "TECHNICIAN" && amount > 0) {
          try {
            const commissionResult = await calculateServiceCommission({
              jobId: job.id,
              totalAmount: amount,
              serviceCategoryId: job.serviceCategoryId || undefined,
              serviceSubCategoryId: job.serviceSubCategoryId || undefined,
              city: job.city || undefined,
              region: job.state || undefined,
              dealerId: job.dealerId || undefined,
            });
            
            // Return only net amount (after commission) to technician
            amount = commissionResult.netAmount;
          } catch (error) {
            console.error(`Error calculating commission for job ${job.id} in listing:`, error);
            // If commission calculation fails, still return the amount
          }
        }
        
        // Filter dealer information based on payment status and role
        let dealerInfo: any = {
          name: job.dealer?.name || "",
          businessName: job.dealer?.dealer?.businessName || job.dealer?.name || "",
        };
        
        if (role === "TECHNICIAN") {
          // For technicians, use privacy filter to hide contact info before payment
          try {
            dealerInfo = filterDealerInfoForTechnician(job.dealer, paymentLocked);
          } catch (error) {
            console.error(`Error filtering dealer info for job ${job.id}:`, error);
            // Fallback to basic info if filtering fails
          }
        } else {
          // For dealers/admins, show all dealer info
          dealerInfo = {
            name: job.dealer?.name || "",
            businessName: job.dealer?.dealer?.businessName || job.dealer?.name || "",
            fullName: job.dealer?.dealer?.fullName || "",
            email: job.dealer?.email || "",
            phone: job.dealer?.phone || "",
          };
        }
        
        // Filter location info for technicians (hide full address before payment)
        let locationInfo: any = {
          city: job.city || "",
          state: job.state || "",
          latitude: job.latitude || null,
          longitude: job.longitude || null,
          placeName: job.placeName || null,
        };
        
        // Only include address and pincode if payment is locked (for technicians)
        if (role !== "TECHNICIAN" || paymentLocked) {
          locationInfo.address = job.address || "";
          locationInfo.pincode = job.pincode || "";
        }
        
        // For technicians, don't include estimatedCost (use amount instead)
        const result: any = {
          ...job,
          amount, // Use calculated net amount for technicians, original for others
          location: locationInfo,
          dealer: dealerInfo,
        };
        
        // Remove estimatedCost for technicians (they should only see amount which is commission-deducted)
        if (role === "TECHNICIAN") {
          delete result.estimatedCost;
          delete result.finalPrice;
        }
        
        return result;
      } catch (error) {
        console.error(`Error transforming job ${job.id}:`, error);
        // Return basic job info even if transformation fails
        // Filter location info for error fallback (hide address for technicians)
        const errorLocationInfo: any = {
          city: job.city || "",
          state: job.state || "",
          latitude: job.latitude || null,
          longitude: job.longitude || null,
          placeName: job.placeName || null,
        };
        
        if (role !== "TECHNICIAN") {
          errorLocationInfo.address = job.address || "";
          errorLocationInfo.pincode = job.pincode || "";
        }
        
        return {
          ...job,
          amount: job.finalPrice || job.estimatedCost || 0,
          location: errorLocationInfo,
          dealer: {
            name: job.dealer?.name || "",
            businessName: job.dealer?.dealer?.businessName || job.dealer?.name || "",
          },
        };
      }
    }));

    console.log(`[Jobs API] Returning ${transformedJobs.length} jobs to ${role === "TECHNICIAN" ? "technician" : role.toLowerCase()}`);
    if (transformedJobs.length > 0) {
      console.log(`[Jobs API] Sample job: ${transformedJobs[0].jobNumber} - ${transformedJobs[0].title}`);
    }

    return NextResponse.json({ jobs: transformedJobs });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// Helper function to find matching technicians
async function findMatchingTechnicians(jobPost: any) {
  try {
    console.log(`[Job Matching] Finding technicians for job ${jobPost.jobNumber}`);
    console.log(`[Job Matching] Job location: lat=${jobPost.latitude}, lng=${jobPost.longitude}, city=${jobPost.city}`);
    console.log(`[Job Matching] Job domain: ${jobPost.serviceDomainId}, skill: ${jobPost.skillId}`);
    
    // Get all approved technicians
    const allTechnicians = await prisma.technician.findMany({
      where: {
        accountStatus: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    console.log(`[Job Matching] Total approved technicians: ${allTechnicians.length}`);
    console.log(`[Job Matching] Job details - CategoryId: ${jobPost.serviceCategoryId}, SubCategoryId: ${jobPost.serviceSubCategoryId}, DomainId: ${jobPost.serviceDomainId}, SkillId: ${jobPost.skillId}`);
    console.log(`[Job Matching] Job location - Lat: ${jobPost.latitude}, Lng: ${jobPost.longitude}, City: ${jobPost.city}, State: ${jobPost.state}`);
    const matchingTechnicians = [];
    let noLocationCount = 0;
    let noSkillCount = 0;
    let noLocationAndSkillCount = 0;

    for (const technician of allTechnicians) {
      // Check location match
      let locationMatch = false;
      let locationMatchReason = "none";
      
      // Convert to numbers and validate (check for null, undefined, 0, or invalid values)
      const jobLat = typeof jobPost.latitude === 'number' ? jobPost.latitude : parseFloat(jobPost.latitude);
      const jobLng = typeof jobPost.longitude === 'number' ? jobPost.longitude : parseFloat(jobPost.longitude);
      const techLat = typeof technician.latitude === 'number' ? technician.latitude : parseFloat(technician.latitude as any);
      const techLng = typeof technician.longitude === 'number' ? technician.longitude : parseFloat(technician.longitude as any);
      
      const hasJobLocation = !isNaN(jobLat) && !isNaN(jobLng) && jobLat !== 0 && jobLng !== 0;
      const hasTechLocation = !isNaN(techLat) && !isNaN(techLng) && techLat !== 0 && techLng !== 0;
      
      if (hasJobLocation && hasTechLocation) {
        // Calculate distance between job and technician locations
        const distance = calculateDistance(jobLat, jobLng, techLat, techLng);
        const maxRadius = technician.serviceRadiusKm || 50; // Default 50km
        
        console.log(`[Job Matching] Tech ${technician.fullName}: Job location (${jobLat}, ${jobLng}), Tech location (${techLat}, ${techLng}), Distance: ${distance.toFixed(2)}km, Radius: ${maxRadius}km`);
        
        if (distance <= maxRadius) {
          locationMatch = true;
          locationMatchReason = `distance: ${distance.toFixed(2)}km within radius: ${maxRadius}km`;
        } else {
          locationMatchReason = `distance: ${distance.toFixed(2)}km exceeds radius: ${maxRadius}km`;
        }
      } else if (jobPost.city && technician.placeName) {
        // Fallback to city/place name matching if coordinates not available
        if (jobPost.city.toLowerCase().trim() === technician.placeName.toLowerCase().trim()) {
          locationMatch = true;
          locationMatchReason = `city match: ${jobPost.city}`;
        } else {
          locationMatchReason = `city mismatch: "${jobPost.city}" vs "${technician.placeName}"`;
        }
      } else if (!hasJobLocation && !hasTechLocation) {
        // If neither has location, allow match (no location data available)
        locationMatch = true;
        locationMatchReason = "neither has location data - allowing match";
      } else if (!hasJobLocation) {
        // If job doesn't have location, allow match (job location not set)
        locationMatch = true;
        locationMatchReason = "job location not set - allowing match";
      } else if (!hasTechLocation) {
        // If technician doesn't have location but job has, check city as fallback
        if (jobPost.city && technician.placeName) {
          if (jobPost.city.toLowerCase().trim() === technician.placeName.toLowerCase().trim()) {
            locationMatch = true;
            locationMatchReason = `city match (tech no coordinates): ${jobPost.city}`;
          } else {
            locationMatchReason = `tech no coordinates, city mismatch: "${jobPost.city}" vs "${technician.placeName}"`;
          }
        } else {
          // If no city data either, allow match as fallback
          locationMatch = true;
          locationMatchReason = "technician location not set - allowing match as fallback";
        }
      }

      // Check skill match - multiple ways to match
      let skillMatch = false;
      let skillMatchReason = "none";
      
      // Method 1: Check serviceDomainId match (most important)
      if (jobPost.serviceDomainId && !skillMatch) {
        try {
          const serviceDomain = await prisma.serviceDomain.findUnique({
            where: { id: jobPost.serviceDomainId },
            select: { title: true, id: true },
          });
          
          if (serviceDomain) {
            // Check if technician's primarySkills include this domain or related skills
            if (technician.primarySkills) {
              const primarySkills = typeof technician.primarySkills === 'string' 
                ? JSON.parse(technician.primarySkills) 
                : technician.primarySkills;
              
              if (Array.isArray(primarySkills)) {
                // Check if any skill has the domainId or domain title
                const hasDomainSkill = primarySkills.some((ps: any) => 
                  ps.domainId === jobPost.serviceDomainId || 
                  ps.serviceDomainId === jobPost.serviceDomainId ||
                  ps.domain === serviceDomain.title ||
                  ps.serviceDomain === serviceDomain.title
                );
                if (hasDomainSkill) {
                  skillMatch = true;
                  skillMatchReason = `primarySkills domain match: ${serviceDomain.title}`;
                } else {
                  // Also check if any skill in this domain matches technician's skills
                  const domainSkills = await prisma.skill.findMany({
                    where: { serviceDomainId: jobPost.serviceDomainId },
                    select: { id: true, title: true },
                  });
                  
                  const hasMatchingSkill = primarySkills.some((ps: any) => 
                    domainSkills.some(ds => 
                      ds.id === ps.skillId || 
                      ds.id === ps.id ||
                      ds.title === ps.skill ||
                      (typeof ps === 'string' && ds.title === ps)
                    )
                  );
                  if (hasMatchingSkill) {
                    skillMatch = true;
                    skillMatchReason = `primarySkills matches domain skills: ${serviceDomain.title}`;
                  }
                }
              }
            }
            
            // Also check serviceCategories for domain-related categories
            if (!skillMatch && technician.serviceCategories && Array.isArray(technician.serviceCategories)) {
              // Check if any category title matches domain-related terms
              const domainMatch = technician.serviceCategories.some((cat: string) => 
                cat.toLowerCase().includes(serviceDomain.title.toLowerCase()) ||
                serviceDomain.title.toLowerCase().includes(cat.toLowerCase())
              );
              if (domainMatch) {
                skillMatch = true;
                skillMatchReason = `serviceCategories domain match: ${serviceDomain.title}`;
              }
            }
          }
        } catch (e) {
          console.error(`[Job Matching] Error checking serviceDomain for technician ${technician.id}:`, e);
        }
      }

      // Method 2: Check serviceCategory match
      if (!skillMatch && technician.serviceCategories && Array.isArray(technician.serviceCategories)) {
        const serviceCategory = await prisma.serviceCategory.findUnique({
          where: { id: jobPost.serviceCategoryId },
          select: { title: true },
        });
        if (serviceCategory && technician.serviceCategories.includes(serviceCategory.title)) {
          skillMatch = true;
          skillMatchReason = `serviceCategory match: ${serviceCategory.title}`;
        }
      }

      // Method 3: Check specific skillId match
      if (!skillMatch && jobPost.skillId && technician.primarySkills) {
        try {
          const primarySkills = typeof technician.primarySkills === 'string' 
            ? JSON.parse(technician.primarySkills) 
            : technician.primarySkills;
          
          if (Array.isArray(primarySkills)) {
            const skill = await prisma.skill.findUnique({
              where: { id: jobPost.skillId },
              select: { title: true, id: true },
            });
            if (skill) {
              const hasSkill = primarySkills.some((ps: any) => 
                ps.skill === skill.title || ps.skillId === skill.id || ps.id === skill.id
              );
              if (hasSkill) {
                skillMatch = true;
                skillMatchReason = `skillId match: ${skill.title}`;
              }
            }
          }
        } catch (e) {
          console.error(`[Job Matching] Error parsing primary skills for technician ${technician.id}:`, e);
        }
      }

      // If both location and skill match, add to matching list
      // If location not set on job, only check skill match
      // Use hasJobLocation variable we calculated earlier
      const shouldMatch = hasJobLocation 
        ? (locationMatch && skillMatch)
        : skillMatch; // If job has no location, only require skill match
      
      if (shouldMatch) {
        matchingTechnicians.push(technician);
        console.log(`[Job Matching] ✅ Matched technician: ${technician.fullName} (${technician.email || technician.mobile}) - Location: ${locationMatchReason}, Skill: ${skillMatchReason}`);
      } else {
        console.log(`[Job Matching] ❌ Skipped technician: ${technician.fullName} - Location: ${locationMatchReason}, Skill: ${skillMatchReason}`);
        if (!locationMatch && !skillMatch) noLocationAndSkillCount++;
        else if (!locationMatch) noLocationCount++;
        else if (!skillMatch) noSkillCount++;
      }
    }

    console.log(`[Job Matching] Summary: ${matchingTechnicians.length} matched out of ${allTechnicians.length} technicians`);
    if (matchingTechnicians.length === 0) {
      console.log(`[Job Matching] ⚠️ No matches found. Reasons: ${noLocationAndSkillCount} no location+skill, ${noLocationCount} no location, ${noSkillCount} no skill`);
    }

    return matchingTechnicians;
  } catch (error) {
    console.error("Error finding matching technicians:", error);
    return [];
  }
}

// Helper function to send job notifications
async function sendJobNotifications(jobPost: any, technicians: any[]) {
  console.log(`[Notifications] Sending notifications to ${technicians.length} technicians for job ${jobPost.jobNumber}`);
  for (const technician of technicians) {
    try {
      console.log(`[Notifications] Sending to technician: ${technician.fullName} (${technician.email}, ${technician.mobile})`);
      // Email notification
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3A59FF 0%, #445AF7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .button { background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Job Available!</h1>
                <p>Job Number: ${jobPost.jobNumber}</p>
              </div>
              <div class="content">
                <p>Hello ${technician.fullName},</p>
                <p>A new job has been posted that matches your skills and location.</p>
                
                <div class="info-box">
                  <h2 style="margin-top: 0;">Job Details</h2>
                  <p><strong>Title:</strong> ${jobPost.title}</p>
                  <p><strong>Description:</strong> ${jobPost.description}</p>
                  <p><strong>Work Details:</strong> ${jobPost.workDetails}</p>
                  <p><strong>Customer:</strong> ${jobPost.customerName}</p>
                  <p><strong>Location:</strong> ${jobPost.address}, ${jobPost.city}, ${jobPost.state} - ${jobPost.pincode}</p>
                  <p><strong>Priority:</strong> ${jobPost.priority}</p>
                  ${jobPost.scheduledAt ? `<p><strong>Scheduled:</strong> ${new Date(jobPost.scheduledAt).toLocaleString()}</p>` : ""}
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.APP_URL || "http://localhost:3000"}/technician/dashboard" class="button">
                    View Job in Dashboard
                  </a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmail({
        to: technician.email,
        subject: `New Job Available - ${jobPost.jobNumber}`,
        html: emailHtml,
      });

      // WhatsApp notification
      const whatsappMessage = `🔔 *New Job Available!*\n\n` +
        `*Job Number:* ${jobPost.jobNumber}\n` +
        `*Title:* ${jobPost.title}\n` +
        `*Description:* ${jobPost.description}\n` +
        `*Customer:* ${jobPost.customerName}\n` +
        `*Location:* ${jobPost.address}, ${jobPost.city}, ${jobPost.state} - ${jobPost.pincode}\n` +
        `*Priority:* ${jobPost.priority}\n\n` +
        `Check your dashboard for more details and to accept this job.\n\n` +
        `Dashboard: ${process.env.APP_URL || "http://localhost:3000"}/technician/dashboard`;

      await sendWhatsAppMessage({
        to: technician.mobile,
        message: whatsappMessage,
      });

      // Create in-app notification in database
      if (technician.userId) {
        await sendNotification({
          userId: technician.userId,
          jobId: jobPost.id,
          type: "JOB_POSTED",
          title: `New Job Available - ${jobPost.jobNumber}`,
          message: `A new job "${jobPost.title}" has been posted that matches your skills and location. Location: ${jobPost.city}, ${jobPost.state}`,
          channels: ["IN_APP"],
          metadata: {
            jobNumber: jobPost.jobNumber,
            jobId: jobPost.id,
            title: jobPost.title,
            location: `${jobPost.city}, ${jobPost.state}`,
            priority: jobPost.priority,
          },
        });
      }
      
      // Note: Email and WhatsApp notifications are already sent above, 
      // this in-app notification is for the dashboard
    } catch (error) {
      console.error(`Error sending notification to technician ${technician.id}:`, error);
    }
  }
}




