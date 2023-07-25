import { DarkMode, LightMode } from './Icon'
import DefaultMonochrome from '@/images/logo/vector/default-monochrome.svg'
import DefaultMonochromeWhite from '@/images/logo/vector/default-monochrome-white.svg'
import Image from 'next/image'

export function Logo(props) {
  return (
    <>
      <LightMode>
        <Image src={DefaultMonochrome} alt="Logo" {...props} />
      </LightMode>
      <DarkMode>
        <Image src={DefaultMonochromeWhite} alt="Logo" {...props} />
      </DarkMode>
    </>
  )
}
