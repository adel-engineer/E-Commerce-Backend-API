import "dotenv/config"

const requiredEnvVariables = [
  "DATABASE_URL",
  "PORT",
  //"JWT_SECRET",
];

for(const variable of requiredEnvVariables) {
    if(!process.env[variable]){
        throw new Error(`Missing environment variable: ${variable}`)
    }
};

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: Number(process.env.PORT),
  //JWT_SECRET: process.env.JWT_SECRET!,
};
