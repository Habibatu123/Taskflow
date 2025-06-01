const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Taskflow API Documentation",
      version: "1.0.0",
      description: "API documentation for Taskflow project management system",
      contact: {
        name: "API Support",
        email: "support@taskflow.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Project: {
          type: "object",
          required: ["name"],
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["active", "archived"] },
            order: { type: "number" },
            owner: { type: "string" },
            tasks: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          required: ["title", "project"],
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["todo", "in-progress", "completed"],
            },
            priority: { type: "string", enum: ["low", "medium", "high"] },
            dueDate: { type: "string", format: "date-time" },
            order: { type: "number" },
            project: { type: "string" },
            assignedTo: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["Admin", "Manager", "Employee"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsdoc(options);
