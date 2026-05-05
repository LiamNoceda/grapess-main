import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, or } from 'drizzle-orm';
import { users, profiles } from '../db/schema';
import { hashPassword } from '../utils/crypto';

type Bindings = {
  DB: D1Database;
};

const auth = new Hono<{ Bindings: Bindings }>();

auth.post('/register', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const lang = body.lang || 'en';

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, body.username),
          eq(users.phone, body.phone)
        )
      )
      .get();

    if (existingUser) {
      return c.json({ 
        error: lang === 'es' ? 'El usuario o teléfono ya existe' : 'Username or phone already exists' 
      }, 400);
    }

    const hashedPassword = await hashPassword(body.password);

    const result = await db.batch([
      db.insert(users).values({
        username: body.username,
        phone: body.phone,
        password: hashedPassword,
      }).returning({ id: users.id }),
      
    ]);

    const newUser = await db.insert(users).values({
      username: body.username,
      phone: body.phone,
      password: hashedPassword,
    }).returning().get();

    await db.insert(profiles).values({
      userId: newUser.id,
      fullName: body.fullName,
    });

    return c.json({ 
      message: lang === 'es' ? '¡Registro exitoso!' : 'Registration successful!' 
    }, 200);

  } catch (e) {
    console.error(e);
    return c.json({ error: 'Server Error' }, 500);
  }
});

export default auth;
