// import type { NextApiRequest, NextApiResponse } from 'next';
// import { serialize } from 'cookie';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   // Menghapus token dengan mengatur cookie token dengan Max-Age 0
//   res.setHeader('Set-Cookie', serialize('token', '', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'strict',
//     path: '/',
//     maxAge: 0, // Menghapus cookie dengan mengatur Max-Age menjadi 0
//   }));

//   res.status(200).json({ message: 'Logout successful' });
// }
