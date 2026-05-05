import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './router/auth'

const app = new Hono()

app.use('/api/*', cors())

app.get('/', (c) => {
  return c.text('Grape is running!')
})

app.route('/api/auth', auth)

export default app
