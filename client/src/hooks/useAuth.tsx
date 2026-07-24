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
    type updateProfilePayload = {
        name: string,
        email: string
    }
    type changePasswordPayload = {
        currentPassword: string,
        newPassword: string
    }
    const adminLogin = async (payload: logInpayload) => {
        setLoading(true)
        try {
            const data = await api.post(`/auth/admin-login`, payload);
            if (data?.data?.success == true) {
                dispatch(setAuth(data.data.data))
                return data.data.data
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
            const data = await api.get(`/auth/check-auth`, { skipErrorToast: true })
            if (data?.data?.success == true) {
                dispatch(setAuth(data.data.data))
                return true
            }
            return false
        }
        catch (error) {
            console.log("Auth check failed:", error)
            setError(error)
            return false
        }
        finally {
            setCheckAUthLoading(false)
        }
    }

    const updateProfile = async (payload: updateProfilePayload) => {
        setLoading(true)
        try {
            const data = await api.put(`/auth/update-profile`, payload)
            if (data?.data?.success == true) {
                dispatch(setAuth(data.data.data))
                return data.data.data
            }
        }
        catch (error) {
            setError(error)
            throw error
        }
        finally {
            setLoading(false)
        }
    }

    const changePassword = async (payload: changePasswordPayload) => {
        setLoading(true)
        try {
            const data = await api.post(`/auth/change-password`, payload)
            if (data?.data?.success == true) {
                return true
            }
            return false
        }
        catch (error) {
            setError(error)
            throw error
        }
        finally {
            setLoading(false)
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
        logOut,
        updateProfile,
        changePassword
    }


}

export default useAuth
