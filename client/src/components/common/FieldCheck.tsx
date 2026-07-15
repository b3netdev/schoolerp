import React from 'react'
import useCheck from '@/hooks/useCheck'
import { checkexistPayload } from '@/hooks/useCheck'


type fieldCheck = checkexistPayload[]
const FieldCheck = () => {
    const { checkExists } = useCheck()
    // console.log(fieldData)




    return (
        <span className='text-red-800'>
           
        </span>
    )
}

export default FieldCheck
