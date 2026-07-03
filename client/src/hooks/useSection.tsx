import { useState } from "react";
import api from "@/lib/api";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setSections,addSection } from "../../redux/slicers/sectionSlicer";




interface addsectionpayload{
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


    return { getSection,addsection }

}

export default useSection