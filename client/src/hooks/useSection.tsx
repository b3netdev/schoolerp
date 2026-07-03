import { useState } from "react";
import api from "@/lib/api";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setSections,addSection,updateSection } from "../../redux/slicers/sectionSlicer";




interface addsectionpayload{
    id?:number,
    name:string,
    stream:string
}

const useSection = () => {
    const dispath = useAppDispatch()

    const getSection = async () => {
        try {
            const result = await api.get('/section/get-sections')
            console.log(result)
            if (result?.data?.success) {
                console.log(result.data)
                dispath(setSections(result.data.data))
            }
        }
        catch (error) {
            console.log(error)
        }
    }
    const addsection = async (payload:addsectionpayload) => {
        try {
            const result = await api.post('/section/add-section', payload)
            if (result?.data?.succes) {
                dispath(addSection(result.data.data))
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const updatesection = async (payload:addsectionpayload)=>{
        try{
            const result = await api.post('/section/update-section', payload)
             if (result?.data?.succes) {
                dispath(updateSection(result.data.data))
            }
        }
        catch(error){

        }

    }


    return { getSection,addsection,updatesection }

}

export default useSection