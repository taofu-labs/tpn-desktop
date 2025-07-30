import { defineConfig } from 'vitest/config'  
  
export default defineConfig({  
  test: {  
    environment: 'node',  
    globals: true,  
    setupFiles: ['./setup.ts'],
     deps: {  
      external: ['electron']  
    } 
  }  
})