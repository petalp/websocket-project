
interface ISysConfig {
    PORT:number
    DATABASE_URL:string
    ARCJET_APIKEY:string
}

export const systemConfig:ISysConfig = {
    PORT:parseInt(process.env.PORT as string) ,
    DATABASE_URL: process.env.DATABASE_URL || " ",
    ARCJET_APIKEY:process.env.ARCJET_KEY || " "
}