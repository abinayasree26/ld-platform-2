const { z } = require('zod');

const studentSchema = z.object({
  name: z.string().trim().min(2, 'Student name must be at least 2 characters long'),
  email: z.string().trim().email('Invalid email address'),
  grade: z.string().optional().default('Class 5'),
  status: z.enum(['active', 'inactive', 'pending']).optional().default('active'),
  ldType: z.enum(['Dyslexia', 'Dyscalculia', 'Dysgraphia', 'Mixed', 'None']).optional(),
  severity: z.enum(['Mild', 'Moderate', 'Severe']).optional(),
});

const cmsQuestionSchema = z.object({
  question: z.string().trim().min(5, 'Question text must be at least 5 characters long'),
  category: z.enum(['Dyslexia', 'Dyscalculia', 'Dysgraphia', 'General']),
  level: z.number().int().min(1).max(5).optional().default(1),
  options: z.array(z.string()).min(2, 'At least 2 options required').optional(),
  correctAnswer: z.string().trim().min(1, 'Correct answer required'),
});

const broadcastNotificationSchema = z.object({
  title: z.string().trim().min(3, 'Notification title must be at least 3 characters long'),
  body: z.string().trim().min(5, 'Notification body must be at least 5 characters long'),
  targetRole: z.string().optional().default('all'),
});

module.exports = {
  studentSchema,
  cmsQuestionSchema,
  broadcastNotificationSchema,
};
