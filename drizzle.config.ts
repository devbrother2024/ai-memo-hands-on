import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// .env.local 파일 로드
dotenv.config({ path: '.env.local' })

export default defineConfig({
    out: './drizzle',
    schema: './lib/db/schema/*.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!
    },
    verbose: true,
    strict: true
})
