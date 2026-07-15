import React from 'react'
import api from '@/lib/api'


export type checkexistPayload = {
    field: string,
    value: string | number | boolean
    label: string,
    at: string
}
const useCheck = () => {
    const checkExists = async (paylod: checkexistPayload) => {

        try {
            const res = await api.post('check-exists/alreadyExistsBy', paylod)
            if (res.data.success) {
                return { success: true, message: res.data.message }
            }
            else {
                return { success: false, message: res.data.message }
            }
        }
        catch (error) {

        }

    }
    return {checkExists}
}

export default useCheck
