import React, { useState } from 'react'
import api from "../lib/api"
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setAuth } from '../../redux/slicers/authslicer'
const useAuth = () => {
    const dispatch = useAppDispatch()
    const [loading , setLoading]  = useState<boolean>(false)
    const [error , setError]  = useState<any>(null)


    type logInpayload = {
        email: string,
        password: string
    }
    const adminLogin = async (payload: logInpayload) => {
        setLoading(true)
        try {
            const data = await api.post(`/auth/admin-login`, payload)
            if (data?.data?.success == true) {
                dispatch(setAuth(data.data.data))
                return true
            }
        }
        catch (error) {
            console.log("ERROR  ",error)
            setError(error)

        }
        finally{
            setLoading(false)
        }
    }



    return {
        adminLogin,
        error,
        loading
    }


}

export default useAuth
