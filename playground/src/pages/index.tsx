import { useState } from 'react'

export default function () {
  const [show, setShow] = useState<boolean>(false)
  const [show2, setShow2] = useState<number>(0)
  return (
    <>
      <div className="items-center flex-col flex justify-center gap-4 mt-20">

        <div className="items-center flex-col flex justify-center w-full" v-if={show}>
          <div>v-if show</div>
          <div v-if={show2 % 2}>
            {' '}
            nest v-if
            {show2}
          </div>
          {/* <div v-else-if={show2 % 3}> nest v-else-if {show2}</div> */}
          <div v-else>
            {' '}
            nest v-else
            {show2}
          </div>
          <button className="bg-[#eee] rounded-lg px-4 py-2 hover:bg-slate-600" onClick={() => setShow2(show2 + 1)}>toggle nest if</button>
        </div>
        <div v-else> v-else not show</div>
        <button className="bg-[#eee] rounded-lg px-4 py-2 hover:bg-slate-600" onClick={() => setShow(!show)}>toggle wrapper if</button>
      </div>
    </>
  )
}
