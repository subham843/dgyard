import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch service categories, sub-categories, domains, and skills for job posting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceCategoryId = searchParams.get("serviceCategoryId");
    const serviceSubCategoryId = searchParams.get("serviceSubCategoryId");
    const serviceDomainId = searchParams.get("serviceDomainId");

    // Fetch service categories (include warrantyDays)
    const serviceCategories = await prisma.serviceCategory.findMany({
      where: { active: true },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        warrantyDays: true,
        active: true,
        order: true,
        createdAt: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    // Fetch service sub-categories if category is selected (include warrantyDays)
    let serviceSubCategories: any[] = [];
    if (serviceCategoryId) {
      serviceSubCategories = await prisma.serviceSubCategory.findMany({
        where: {
          serviceCategoryId,
          active: true,
        },
        select: {
          id: true,
          title: true,
          shortDescription: true,
          warrantyDays: true,
          serviceCategoryId: true,
          active: true,
          order: true,
          createdAt: true,
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });
    }

    // Fetch service domains if sub-category is selected
    let serviceDomains: any[] = [];
    if (serviceSubCategoryId) {
      const domainSubCategories = await prisma.serviceDomainSubCategory.findMany({
        where: { serviceSubCategoryId },
        include: {
          serviceDomain: {
            include: {
              skills: {
                where: { active: true },
                orderBy: [{ order: "asc" }, { createdAt: "desc" }],
              },
            },
          },
        },
      });
      
      // Filter out null domains and only include active domains
      serviceDomains = domainSubCategories
        .map((dsc) => dsc.serviceDomain)
        .filter((domain) => {
          if (!domain) return false;
          // Only include active domains
          return domain.active === true;
        })
        .sort((a, b) => {
          // Sort by order field, then by creation date
          if (a.order !== b.order) {
            return a.order - b.order;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      
      console.log(`[Jobs Skills API] Found ${serviceDomains.length} active service domains for sub-category ${serviceSubCategoryId}`);
    }

    // Fetch skills if domain is selected
    let skills: any[] = [];
    if (serviceDomainId) {
      skills = await prisma.skill.findMany({
        where: {
          serviceDomainId,
          active: true,
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });
    }

    return NextResponse.json({
      serviceCategories,
      serviceSubCategories,
      serviceDomains,
      skills,
    });
  } catch (error: any) {
    console.error("Error fetching skills data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch skills data" },
      { status: 500 }
    );
  }
}












