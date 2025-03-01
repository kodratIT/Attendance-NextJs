'use client'

// React Imports
import { useState,useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie';

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Import Firebase authentication
import { auth } from '@/libs/firebase/firebase'; // adjust the path to your Firebase config
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { jwtDecode } from 'jwt-decode';

// Styled Custom Components
const LoginIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 680,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const LoginV2 = ({ mode }: { mode: SystemMode }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  useEffect(() => {
    const token = Cookies.get('token'); // Get the token from cookies
    if (token) {
      try {
        const decoded = jwtDecode<{ exp: number }>(token);
        const currentTime = Date.now() / 1000; // Current time in seconds
        if (decoded.exp > currentTime) {
          router.push('/home'); // Redirect to home if token is valid
        } else {
          console.log('Token is expired');
          router.push('/login'); // Redirect to login if token is expired
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        router.push('/login'); // Redirect to login on decoding error
      }
    } else {
      router.push('/login'); // Redirect to login if no token
    }
  }, [router]);

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleLogin = async (event: any) => {
  event.preventDefault();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    Cookies.set('token', token, { expires: 1 / 24 }); // Token expires in 1 hour

    // Pengecekan token apakah masih valid
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Coba perbarui token untuk mengecek validitas
          const freshToken = await user.getIdToken(true);
          console.log('Token is refreshed and valid:', freshToken);
          Cookies.set('token', freshToken, { expires: 1 / 24 }); // Refresh the cookie with the new token
          router.push('/home'); // Redirect to home if token is valid
        } catch (error) {
          console.error('Error refreshing token:', error);
          // Handle token refresh errors (e.g., redirect to login page)
        }
      } else {
        console.log('No user is signed in or token is expired.');
        // Redirect to login or handle the case where token is invalid/expired
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    // Optionally handle errors (e.g., display error message)
  }
};

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <LoginIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && (
          <MaskImg
            alt='mask'
            src={authBackground}
            className={classnames({ 'scale-x-[-1]': theme.direction === 'rtl' })}
          />
        )}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
            <Typography>Please sign-in to your account and start the adventure</Typography>
          </div>
          <form 
            noValidate
            autoComplete='off'
            onSubmit={handleLogin}
            className='flex flex-col gap-5'
          >
            <CustomTextField autoFocus fullWidth label='Email or Username' placeholder='Enter your email or username' onChange={(e) => setEmail(e.target.value)} />
            <CustomTextField
              fullWidth
              label='Password'
              placeholder='············'
              id='outlined-adornment-password'
              type={isPasswordShown ? 'text' : 'password'}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                      <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button fullWidth variant='contained' type='submit'>
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginV2
