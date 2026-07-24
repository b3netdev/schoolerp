import { useState } from "react";
import api from "@/lib/api";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setSections, addSection, updateSection, deleteSection } from "../../redux/slicers/sectionSlicer";

interface addsectionpayload {
    id?: number;
    name: string;
    stream: string;
    status?: string;
    description?: string;
}

const useSection = () => {
    const dispath = useAppDispatch()

    const getSection = async (status: string = "all") => {
        try {
            const result = await api.get(`/section/get-sections?status=${status}`)
            if (result?.data?.success) {
                dispath(setSections(result.data.data))
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const addsection = async (payload: addsectionpayload) => {
        try {
            const result = await api.post('/section/add-section', payload)
            if (result?.data?.success) {
                dispath(addSection(result.data.data))
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const updatesection = async (payload: addsectionpayload) => {
        try {
            const result = await api.post('/section/update-section', payload)
            if (result?.data?.success) {
                dispath(updateSection(result.data.data))
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const deletesection = async (id: number) => {
        try {
            const result = await api.delete(`/section/delete-section/${id}`)
            if (result?.data?.success) {
                dispath(deleteSection(id))
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const restoresection = async (id: number) => {
        try {
            const result = await api.patch(`/section/restore-section/${id}`)
            if (result?.data?.success) {
                dispath(updateSection(result.data.data))
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const hardDeletesection = async (id: number) => {
        try {
            const result = await api.delete(`/section/hard-delete-section/${id}`)
            if (result?.data?.success) {
                dispath(deleteSection(id))
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    return { 
        getSection, 
        addsection, 
        updatesection, 
        deletesection, 
        restoresection, 
        hardDeletesection 
    }
}

export default useSection