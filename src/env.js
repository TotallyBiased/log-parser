/**
 * Purpose: This file is imported before any other module at the root
 * of the application to initialize the environment variables with
 * `dotenv`.
 * 
 * This method allows `dotenv` to be used with `nodemon`. 
 */
import dotenv from 'dotenv'
dotenv.config({ silent: true })
