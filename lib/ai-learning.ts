import { prisma } from "@/lib/prisma";

// Extract keywords from message
export function extractKeywords(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
  
  const words = lowerMessage
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  return [...new Set(words)].slice(0, 10); // Return unique keywords, max 10
}

// Normalize question pattern
export function normalizeQuestionPattern(message: string): string {
  let normalized = message.toLowerCase();
  
  // Remove special characters
  normalized = normalized.replace(/[^\w\s]/g, ' ');
  
  // Replace numbers with placeholder
  normalized = normalized.replace(/\d+/g, '[NUMBER]');
  
  // Replace common variations
  normalized = normalized.replace(/\b(how|what|where|when|why|who)\b/g, '[QUESTION]');
  normalized = normalized.replace(/\b(can|could|should|would|will)\b/g, '[MODAL]');
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// Categorize question
export function categorizeQuestion(message: string, context: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('product') || lowerMessage.includes('camera') || lowerMessage.includes('cctv') || 
      lowerMessage.includes('price') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
    return 'product';
  }
  if (lowerMessage.includes('quotation') || lowerMessage.includes('quote') || lowerMessage.includes('estimate')) {
    return 'quotation';
  }
  if (lowerMessage.includes('service') || lowerMessage.includes('booking') || lowerMessage.includes('installation')) {
    return 'service';
  }
  if (lowerMessage.includes('order') || lowerMessage.includes('track') || lowerMessage.includes('status')) {
    return 'order';
  }
  if (lowerMessage.includes('account') || lowerMessage.includes('profile') || lowerMessage.includes('address')) {
    return 'account';
  }
  if (lowerMessage.includes('admin') || lowerMessage.includes('manage') || lowerMessage.includes('upload') || 
      lowerMessage.includes('analytics') || lowerMessage.includes('user management')) {
    return 'admin';
  }
  
  return 'general';
}

// Store conversation for learning
export async function storeConversation(
  userId: string | undefined,
  userRole: string,
  message: string,
  response: string,
  responseSource: string,
  language: string,
  context?: string,
  currentPath?: string
) {
  try {
    const conversation = await prisma.aIConversation.create({
      data: {
        userId: userId || undefined,
        userRole,
        message,
        response,
        responseSource,
        language,
        context: context?.substring(0, 2000), // Limit context length
        currentPath,
        qualityScore: 0.5, // Default score
      },
    });

    // Extract and store knowledge
    const keywords = extractKeywords(message);
    const questionPattern = normalizeQuestionPattern(message);
    const category = categorizeQuestion(message, context || '');

    // Check if similar knowledge exists
    const existingKnowledge = await prisma.aIKnowledgeBase.findFirst({
      where: {
        questionPattern: {
          contains: questionPattern.substring(0, 50), // Partial match
        },
        category,
        userRole,
      },
    });

    if (existingKnowledge) {
      // Update existing knowledge
      await prisma.aIKnowledgeBase.update({
        where: { id: existingKnowledge.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          keywords: [...new Set([...existingKnowledge.keywords, ...keywords])].slice(0, 15),
        },
      });
    } else {
      // Create new knowledge entry
      await prisma.aIKnowledgeBase.create({
        data: {
          conversationId: conversation.id,
          questionPattern,
          answerTemplate: response.substring(0, 500), // Store response template
          keywords,
          category,
          userRole,
        },
      });
    }

    return conversation;
  } catch (error) {
    console.error("Error storing conversation:", error);
    return null;
  }
}

// Find similar past conversations
export async function findSimilarConversations(
  message: string,
  userRole: string,
  limit: number = 5
): Promise<Array<{ response: string; qualityScore: number; usageCount: number }>> {
  try {
    const keywords = extractKeywords(message);
    const questionPattern = normalizeQuestionPattern(message);
    const category = categorizeQuestion(message, '');

    // Find similar knowledge base entries
    const similarKnowledge = await prisma.aIKnowledgeBase.findMany({
      where: {
        userRole,
        category,
        OR: [
          {
            keywords: {
              hasSome: keywords.slice(0, 5), // Match at least some keywords
            },
          },
          {
            questionPattern: {
              contains: questionPattern.substring(0, 30), // Partial pattern match
            },
          },
        ],
        qualityScore: {
          gte: 0.6, // Only use high-quality responses
        },
      },
      orderBy: [
        { qualityScore: 'desc' },
        { successCount: 'desc' },
        { lastUsedAt: 'desc' },
      ],
      take: limit,
      include: {
        conversation: {
          select: {
            response: true,
            qualityScore: true,
            usageCount: true,
          },
        },
      },
    });

    return similarKnowledge.map(kb => ({
      response: kb.answerTemplate,
      qualityScore: kb.qualityScore,
      usageCount: kb.successCount,
    }));
  } catch (error) {
    console.error("Error finding similar conversations:", error);
    return [];
  }
}

// Update quality score based on feedback
export async function updateQualityScore(
  conversationId: string,
  rating: number,
  correctedResponse?: string
) {
  try {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        knowledgeBaseEntries: true,
      },
    });

    if (!conversation) return;

    // Calculate quality score (rating 1-5, or -1/1 for thumbs)
    let qualityScore = 0.5;
    if (rating > 0) {
      qualityScore = rating / 5; // Normalize to 0-1
    } else if (rating === -1) {
      qualityScore = 0.2; // Thumbs down
    } else if (rating === 1) {
      qualityScore = 0.8; // Thumbs up
    }

    // Update conversation
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        qualityScore,
        ...(correctedResponse && { response: correctedResponse }),
      },
    });

    // Update or create feedback
    await prisma.aIConversationFeedback.upsert({
      where: { conversationId },
      create: {
        conversationId,
        rating,
        feedbackType: rating > 0 ? 'rating' : (rating === 1 ? 'thumbs-up' : 'thumbs-down'),
        correctedResponse,
      },
      update: {
        rating,
        correctedResponse,
      },
    });

    // Update knowledge base entries
    for (const kb of conversation.knowledgeBaseEntries) {
      const isSuccess = qualityScore >= 0.6;
      
      await prisma.aIKnowledgeBase.update({
        where: { id: kb.id },
        data: {
          qualityScore: (kb.qualityScore * kb.successCount + qualityScore) / (kb.successCount + 1),
          successCount: isSuccess ? kb.successCount + 1 : kb.successCount,
          failureCount: !isSuccess ? kb.failureCount + 1 : kb.failureCount,
          ...(correctedResponse && { answerTemplate: correctedResponse.substring(0, 500) }),
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating quality score:", error);
    return false;
  }
}

// Get best response from knowledge base
export async function getBestResponseFromKnowledge(
  message: string,
  userRole: string
): Promise<string | null> {
  try {
    const similar = await findSimilarConversations(message, userRole, 1);
    
    if (similar.length > 0 && similar[0].qualityScore >= 0.7) {
      // Use high-quality past response
      return similar[0].response;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting best response from knowledge:", error);
    return null;
  }
}

// Learn from pattern
export async function learnPattern(
  patternType: string,
  pattern: string,
  example: string,
  category: string,
  userRole: string,
  success: boolean
) {
  try {
    const existing = await prisma.aILearningPattern.findFirst({
      where: {
        patternType,
        pattern,
        category,
        userRole,
      },
    });

    if (existing) {
      // Update existing pattern
      const newSuccessRate = success
        ? (existing.successRate * existing.usageCount + 1) / (existing.usageCount + 1)
        : (existing.successRate * existing.usageCount) / (existing.usageCount + 1);

      await prisma.aILearningPattern.update({
        where: { id: existing.id },
        data: {
          usageCount: { increment: 1 },
          successRate: newSuccessRate,
          confidence: Math.min(existing.confidence + 0.01, 1.0), // Gradually increase confidence
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new pattern
      await prisma.aILearningPattern.create({
        data: {
          patternType,
          pattern,
          example,
          category,
          userRole,
          confidence: 0.5,
          successRate: success ? 1.0 : 0.0,
          usageCount: 1,
        },
      });
    }
  } catch (error) {
    console.error("Error learning pattern:", error);
  }
}

