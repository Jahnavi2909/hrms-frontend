import { useState, useEffect } from "react";
import { attendanceApi } from "../../services/api";
import dayjs from "dayjs"; 

const useAutoCheckout = () => {
  useEffect(() => {
    const now = new Date();
    const endTime = new Date();
    endTime.setHours(18, 0, 0, 0); 

    let timeoutMs = endTime - now;

    if (timeoutMs < 0) {
      
      timeoutMs = 0;
    }

    const timer = setTimeout(async () => {
      try {
        
        await attendanceApi.autoCheckout(); 
        console.log("Auto checkout completed at end of day");
       
        window.dispatchEvent(new Event("attendance-updated"));
      } catch (err) {
        console.error("Auto checkout failed", err);
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, []);
};

export default useAutoCheckout;
