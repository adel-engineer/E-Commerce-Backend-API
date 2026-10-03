import "dotenv/config"

const requiredEnvVariables = [
  "DATABASE_URL",
  "PORT",
  "JWT_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
];

for(const variable of requiredEnvVariables) {
    if(!process.env[variable]){
        throw new Error(`Missing environment variable: ${variable}`)
    }
};

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: Number(process.env.PORT),
  JWT_SECRET: process.env.JWT_SECRET!,

  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_PORT: Number(process.env.SMTP_PORT),
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD!,
};
