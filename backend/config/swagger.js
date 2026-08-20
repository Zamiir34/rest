const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant QR Ordering & POS API',
      version: '1.0.0',
      description: 'Complete REST API for Restaurant QR Ordering and POS Management System',
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development' },
      { url: 'https://your-backend.onrender.com/api', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
