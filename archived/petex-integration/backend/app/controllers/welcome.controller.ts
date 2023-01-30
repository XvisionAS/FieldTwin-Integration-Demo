/* app/controllers/welcome.controller.ts */

// Import only what we need from express
import { Request, Response, Router } from 'express'

// Assign router to the express.Router() instance
const router: Router = Router()

// The / here corresponds to the route that the WelcomeController
// is mounted on in the server.ts file.
// In this case it's /welcome

router.get('/', (_req: Request, res: Response) => {
  // Reply with a hello world when no name param is provided
  res.send('Hello, World!')
})

router.get('/:name', (req: Request, res: Response) => {
  // Extract the name from the request parameters
  const { name } = req.params

  // Greet the given name
  res.send(`Hello, ${name}`)
})

// Export the express.Router() instance to be used by server.ts
export const WelcomeController: Router = router
