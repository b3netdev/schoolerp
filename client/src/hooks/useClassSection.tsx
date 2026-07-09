import api from "@/lib/api";
import { useAppDispatch } from "../../redux/hooks";
import {
  setClassSectionRelations,
  addClassSectionRelation,
  updateClassSectionRelation,
  deleteClassSectionRelation,
} from "../../redux/slicers/classSectionRelationSlicer";

export interface ClassSectionRelationPayload {
  id?: number;
  class_id: number;
  section_id: number;
  teacher_id: number;
}

const useClassSection = () => {
  const dispatch = useAppDispatch();

  const getClassSections = async () => {
    try {
      const result = await api.get(
        "/class-section/get-class-section-relations"
      );

      if (result?.data?.success) {
        dispatch(setClassSectionRelations(result.data.data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addClassSection = async (payload: ClassSectionRelationPayload) => {
    try {
      const result = await api.post(
        "/class-section/add-class-section-relation",
        payload
      );

      if (result?.data?.success) {
        dispatch(addClassSectionRelation(result.data.data));
        return result.data.data;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateClassSection = async (payload: ClassSectionRelationPayload) => {
    try {
      const result = await api.post(
        "/class-section/update-class-section-relation",
        payload
      );

      if (result?.data?.success) {
        dispatch(updateClassSectionRelation(result.data.data));
        return result.data.data;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteClassSection = async (id: number) => {
    try {
      const result = await api.delete(
        `/class-section/delete-class-section-relation/${id}`
      );

      if (result?.data?.success) {
        dispatch(deleteClassSectionRelation(id));
        return true;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return {
    getClassSections,
    addClassSection,
    updateClassSection,
    deleteClassSection,
  };
};

export default useClassSection;