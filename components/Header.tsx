import React from 'react'

type Props = {
  address?:string
  network?:string
}

const Header = (props: Props) => {
  const shortenAddress= (address:string)=>{
    return address.slice(0,6)+" . . . "+ address.slice(-4);
  }
  return (
    <header className='fixed w-full bg-yellow-50 z-50'>
        <nav className="p-8 flex  justify-between items-center select-none">
          <div className="flex  items-center gap-2">
            <button className="text-5xl hover:animate-pulse cursor-pointer active:scale-90 duration-300 hover:scale-110 ease-in-out">⚡</button>
            <div>
              <h1 className="text-3xl whitespace-nowrap font-display">
                Wagmi Name Service{" "}
              </h1>
              <span className=" whitespace-nowrap font-thin font-display  text-gray-400">
                we all are gonna make it.
              </span>
            </div>
          </div>
         <div className='flex items-center gap-2'>
            <div className='hidden lg:block font-display whitespace-nowrap p-4 rounded-2xl bg-lime-100 text-lime-600'>
              {props.network}
            </div>
          <div className='bg-amber-300 whitespace-nowrap text-amber-900 font-bold tracking-wider font-display p-4 rounded-2xl'>
            { props.address ? shortenAddress(props.address) : 'Not Connected'}
          </div>
          </div>
        </nav>
      </header>
  )
}

export default Header