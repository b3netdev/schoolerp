import React, { useState } from 'react'
import api from "../lib/api"
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setAuth } from '../../redux/slicers/authslicer'
const useAuth = () => {
    const dispatch = useAppDispatch()
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<any>(null)
    const [checkAuthLoading, setCheckAUthLoading] = useState(true)


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
            setError(error)

        }
        finally {
            setLoading(false)
        }
    }

    const checkAuth = async () => {
        try {
            setCheckAUthLoading(true)
            const data = await api.get(`/auth/check-auth`)
            if (data?.data?.success == true) {
                dispatch(setAuth(data.data.data))
                return true
            }
        }
        catch (error) {
            setError(error)
        }
        finally {
            setCheckAUthLoading(false)
        }
    }

    const logOut = async () => {
        try {
            const response = await api.post("/auth/logout")
            if (response.data.success) {
                return true
            }
            return false

        }
        catch (error) {
            return false

        }
    }


    return {
        adminLogin,
        error,
        loading,
        checkAuth,
        checkAuthLoading,
        logOut
    }


}

export default useAuth
