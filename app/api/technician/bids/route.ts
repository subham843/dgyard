import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    // Get all original bids by this technician (not counter offers from dealer)
    // Note: Dealer's counter offers have isCounterOffer=true but technicianId is still the technician
    // So we filter by isCounterOffer=false to get only technician's original bids
    let bids;
    try {
      bids = await prisma.jobBid.findMany({
        where: {
          technicianId: technician.id,
          isCounterOffer: false, // Only get technician's original bids
        },
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
              description: true,
              status: true,
              estimatedCost: true,
              finalPrice: true,
              priceLocked: true,
              allowBargaining: true,
              negotiationRounds: true,
              city: true,
              state: true,
              latitude: true,
              longitude: true,
              dealerName: true,
              dealerPhone: true,
              priority: true,
              scheduledAt: true,
            },
          },
          previousBid: {
            select: {
              id: true,
              offeredPrice: true,
              status: true,
            },
          },
          counterOffers: {
            // Dealer's counter offers (bids with previousBidId pointing to this bid)
            where: {
              isCounterOffer: true, // Only get dealer's counter offers
            },
            select: {
              id: true,
              offeredPrice: true,
              status: true,
              createdAt: true,
              roundNumber: true,
              isCounterOffer: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error: any) {
      // Handle case where job relation is null (orphaned bids)
      // This can happen if there's data inconsistency
      if (error.message?.includes("Field job is required to return data")) {
        // Try again without including job details
        bids = await prisma.jobBid.findMany({
          where: {
            technicianId: technician.id,
            isCounterOffer: false,
          },
          select: {
            id: true,
            jobId: true,
            technicianId: true,
            offeredPrice: true,
            message: true,
            status: true,
            isCounterOffer: true,
            roundNumber: true,
            previousBidId: true,
            distanceKm: true,
            technicianRating: true,
            createdAt: true,
            updatedAt: true,
            previousBid: {
              select: {
                id: true,
                offeredPrice: true,
                status: true,
              },
            },
            counterOffers: {
              where: {
                isCounterOffer: true, // Only get dealer's counter offers
              },
              select: {
                id: true,
                offeredPrice: true,
                status: true,
                createdAt: true,
                roundNumber: true,
                isCounterOffer: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        // Fetch job details separately for valid jobIds
        const jobIds = bids.map(bid => bid.jobId).filter(Boolean);
        const jobs = await prisma.jobPost.findMany({
          where: { id: { in: jobIds } },
          select: {
            id: true,
            jobNumber: true,
            title: true,
            description: true,
            status: true,
            estimatedCost: true,
            finalPrice: true,
            priceLocked: true,
            allowBargaining: true,
            negotiationRounds: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
            dealerName: true,
            dealerPhone: true,
            priority: true,
            scheduledAt: true,
          },
        });
        // Map jobs to bids
        bids = bids.map(bid => ({
          ...bid,
          job: jobs.find(j => j.id === bid.jobId) || null,
        })).filter(bid => bid.job !== null);
      } else {
        throw error;
      }
    }

    return NextResponse.json({ bids });
  } catch (error: any) {
    console.error("Error fetching technician bids:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bids" },
      { status: 500 }
    );
  }
}


