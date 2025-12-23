/**
 * Commission Calculator Service
 * 
 * Calculates platform commission based on configured rules
 */

import { prisma } from "@/lib/prisma";
import { CommissionType, JobType } from "@prisma/client";

export interface CommissionCalculationResult {
  commissionType: "PERCENTAGE" | "FIXED";
  commissionValue: number;
  commissionAmount: number;
  netAmount: number;
  ruleId?: string;
  ruleSource?: string; // "default" | "jobType" | "city" | "region" | "dealer"
}

/**
 * Calculate service commission for a job
 */
export async function calculateServiceCommission(params: {
  jobId: string;
  totalAmount: number;
  jobType?: JobType;
  city?: string;
  region?: string;
  dealerId?: string;
  serviceCategoryId?: string;
  serviceSubCategoryId?: string;
}): Promise<CommissionCalculationResult> {
  const { jobId, totalAmount, jobType, city, region, dealerId, serviceCategoryId, serviceSubCategoryId } = params;

  // Priority order: dealer-specific > serviceSubCategory > serviceCategory > city > region > jobType > default
  const now = new Date();

  // 1. Check dealer-specific override with service subcategory
  if (dealerId && serviceSubCategoryId) {
    const dealerSubCatRule = await prisma.serviceCommission.findFirst({
      where: {
        dealerId,
        serviceSubCategoryId,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (dealerSubCatRule) {
      return calculateCommissionAmount(
        dealerSubCatRule.commissionType,
        dealerSubCatRule.commissionValue,
        totalAmount,
        dealerSubCatRule.id,
        "dealer-serviceSubCategory"
      );
    }
  }

  // 2. Check dealer-specific override with service category
  if (dealerId && serviceCategoryId) {
    const dealerCatRule = await prisma.serviceCommission.findFirst({
      where: {
        dealerId,
        serviceCategoryId,
        serviceSubCategoryId: null,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (dealerCatRule) {
      return calculateCommissionAmount(
        dealerCatRule.commissionType,
        dealerCatRule.commissionValue,
        totalAmount,
        dealerCatRule.id,
        "dealer-serviceCategory"
      );
    }
  }

  // 3. Check dealer-specific override (general)
  if (dealerId) {
    const dealerRule = await prisma.serviceCommission.findFirst({
      where: {
        dealerId,
        serviceCategoryId: null,
        serviceSubCategoryId: null,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (dealerRule) {
      return calculateCommissionAmount(
        dealerRule.commissionType,
        dealerRule.commissionValue,
        totalAmount,
        dealerRule.id,
        "dealer"
      );
    }
  }

  // 4. Check service subcategory-specific rule (no dealer filter)
  if (serviceSubCategoryId) {
    const subCatRule = await prisma.serviceCommission.findFirst({
      where: {
        serviceSubCategoryId,
        dealerId: null,
        city: null,
        region: null,
        jobType: null,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (subCatRule) {
      return calculateCommissionAmount(
        subCatRule.commissionType,
        subCatRule.commissionValue,
        totalAmount,
        subCatRule.id,
        "serviceSubCategory"
      );
    }
  }

  // 5. Check service category-specific rule (no dealer filter)
  if (serviceCategoryId) {
    const catRule = await prisma.serviceCommission.findFirst({
      where: {
        serviceCategoryId,
        serviceSubCategoryId: null,
        dealerId: null,
        city: null,
        region: null,
        jobType: null,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (catRule) {
      return calculateCommissionAmount(
        catRule.commissionType,
        catRule.commissionValue,
        totalAmount,
        catRule.id,
        "serviceCategory"
      );
    }
  }

  // 6. Check city-specific rule
  if (city) {
    const cityRule = await prisma.serviceCommission.findFirst({
      where: {
        city,
        dealerId: null,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (cityRule) {
      return calculateCommissionAmount(
        cityRule.commissionType,
        cityRule.commissionValue,
        totalAmount,
        cityRule.id,
        "city"
      );
    }
  }

  // 7. Check region-specific rule
  if (region) {
    const regionRule = await prisma.serviceCommission.findFirst({
      where: {
        region,
        dealerId: null,
        city: null,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (regionRule) {
      return calculateCommissionAmount(
        regionRule.commissionType,
        regionRule.commissionValue,
        totalAmount,
        regionRule.id,
        "region"
      );
    }
  }

  // 8. Check jobType-specific rule
  if (jobType) {
    const jobTypeRule = await prisma.serviceCommission.findFirst({
      where: {
        jobType,
        dealerId: null,
        city: null,
        region: null,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (jobTypeRule) {
      return calculateCommissionAmount(
        jobTypeRule.commissionType,
        jobTypeRule.commissionValue,
        totalAmount,
        jobTypeRule.id,
        "jobType"
      );
    }
  }

  // 9. Default rule (no filters)
  const defaultRule = await prisma.serviceCommission.findFirst({
    where: {
      dealerId: null,
      jobType: null,
      city: null,
      region: null,
      isActive: true,
      effectiveFrom: { lte: now },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: now } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (defaultRule) {
    return calculateCommissionAmount(
      defaultRule.commissionType,
      defaultRule.commissionValue,
      totalAmount,
      defaultRule.id,
      "default"
    );
  }

  // No rule found - return zero commission
  return {
    commissionType: "PERCENTAGE",
    commissionValue: 0,
    commissionAmount: 0,
    netAmount: totalAmount,
  };
}

/**
 * Calculate product commission for an order
 */
export async function calculateProductCommission(params: {
  orderId: string;
  totalAmount: number;
  categoryId?: string;
  subCategoryId?: string;
  isCOD?: boolean;
  isReturn?: boolean;
}): Promise<CommissionCalculationResult & { codCharge?: number; returnPenalty?: number }> {
  const { orderId, totalAmount, categoryId, subCategoryId, isCOD, isReturn } = params;
  const now = new Date();

  // 1. Check subcategory-specific rule (highest priority)
  if (subCategoryId) {
    const subCategoryRule = await prisma.productCommission.findFirst({
      where: {
        subCategoryId,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (subCategoryRule) {
      const commissionAmount = (totalAmount * subCategoryRule.commissionPercentage) / 100;
      const netAmount = totalAmount - commissionAmount;

      let codCharge = 0;
      let returnPenalty = 0;

      if (isCOD && subCategoryRule.codExtraCharge) {
        codCharge = subCategoryRule.codExtraCharge;
      }

      if (isReturn && subCategoryRule.returnPenaltyPercent) {
        returnPenalty = (totalAmount * subCategoryRule.returnPenaltyPercent) / 100;
      }

      return {
        commissionType: "PERCENTAGE",
        commissionValue: subCategoryRule.commissionPercentage,
        commissionAmount,
        netAmount: netAmount - codCharge - returnPenalty,
        ruleId: subCategoryRule.id,
        ruleSource: "subcategory",
        codCharge,
        returnPenalty,
      };
    }
  }

  // 2. Check category-specific rule
  if (categoryId) {
    const categoryRule = await prisma.productCommission.findFirst({
      where: {
        categoryId,
        subCategoryId: null, // Only category rules, not subcategory
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (categoryRule) {
      const commissionAmount = (totalAmount * categoryRule.commissionPercentage) / 100;
      const netAmount = totalAmount - commissionAmount;

      let codCharge = 0;
      let returnPenalty = 0;

      if (isCOD && categoryRule.codExtraCharge) {
        codCharge = categoryRule.codExtraCharge;
      }

      if (isReturn && categoryRule.returnPenaltyPercent) {
        returnPenalty = (totalAmount * categoryRule.returnPenaltyPercent) / 100;
      }

      return {
        commissionType: "PERCENTAGE",
        commissionValue: categoryRule.commissionPercentage,
        commissionAmount,
        netAmount: netAmount - codCharge - returnPenalty,
        ruleId: categoryRule.id,
        ruleSource: "category",
        codCharge,
        returnPenalty,
      };
    }
  }

  // 3. Default rule
  const defaultRule = await prisma.productCommission.findFirst({
    where: {
      categoryId: null,
      subCategoryId: null,
      isActive: true,
      effectiveFrom: { lte: now },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: now } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (defaultRule) {
    const commissionAmount = (totalAmount * defaultRule.commissionPercentage) / 100;
    const netAmount = totalAmount - commissionAmount;

    let codCharge = 0;
    let returnPenalty = 0;

    if (isCOD && defaultRule.codExtraCharge) {
      codCharge = defaultRule.codExtraCharge;
    }

    if (isReturn && defaultRule.returnPenaltyPercent) {
      returnPenalty = (totalAmount * defaultRule.returnPenaltyPercent) / 100;
    }

    return {
      commissionType: "PERCENTAGE",
      commissionValue: defaultRule.commissionPercentage,
      commissionAmount,
      netAmount: netAmount - codCharge - returnPenalty,
      ruleId: defaultRule.id,
      ruleSource: "default",
      codCharge,
      returnPenalty,
    };
  }

  // No rule found
  return {
    commissionType: "PERCENTAGE",
    commissionValue: 0,
    commissionAmount: 0,
    netAmount: totalAmount,
  };
}

/**
 * Check if platform margin meets minimum requirement
 */
export async function checkMinimumMargin(params: {
  commissionAmount: number;
  totalAmount: number;
  isService: boolean;
  isProduct: boolean;
}): Promise<{
  meetsMinimum: boolean;
  minimumRequired: number;
  actualMargin: number;
  requiresApproval: boolean;
  autoReject: boolean;
  ruleId?: string;
}> {
  const { commissionAmount, totalAmount, isService, isProduct } = params;
  const now = new Date();

  const rule = await prisma.minimumMarginRule.findFirst({
    where: {
      isActive: true,
      effectiveFrom: { lte: now },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: now } },
      ],
      OR: [
        { applyToService: isService },
        { applyToProduct: isProduct },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!rule) {
    return {
      meetsMinimum: true,
      minimumRequired: 0,
      actualMargin: commissionAmount,
      requiresApproval: false,
      autoReject: false,
    };
  }

  const minimumRequired = rule.minimumMarginPercent
    ? (totalAmount * rule.minimumMarginPercent) / 100
    : rule.minimumMarginAmount;

  const meetsMinimum = commissionAmount >= minimumRequired;

  return {
    meetsMinimum,
    minimumRequired,
    actualMargin: commissionAmount,
    requiresApproval: rule.requiresApproval && !meetsMinimum,
    autoReject: rule.autoReject && !meetsMinimum,
    ruleId: rule.id,
  };
}

/**
 * Helper function to calculate commission amount
 */
function calculateCommissionAmount(
  commissionType: CommissionType,
  commissionValue: number,
  totalAmount: number,
  ruleId?: string,
  ruleSource?: string
): CommissionCalculationResult {
  let commissionAmount = 0;

  if (commissionType === "PERCENTAGE") {
    commissionAmount = (totalAmount * commissionValue) / 100;
  } else {
    // FIXED
    commissionAmount = commissionValue;
  }

  const netAmount = totalAmount - commissionAmount;

  return {
    commissionType: commissionType as "PERCENTAGE" | "FIXED",
    commissionValue,
    commissionAmount,
    netAmount,
    ruleId,
    ruleSource,
  };
}

