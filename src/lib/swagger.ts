import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api', // API folder path
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'University Management System API',
        version: '1.0.0',
        description:
          'API documentation for University Management System. You can test all APIs directly from this interface.',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT token in the format: Bearer <token>',
          },
        },
      },
      security: [{ BearerAuth: [] }],
    },
  });
  return spec;
};
