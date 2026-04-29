"use client"

import {useUser} from "@clerk/nextjs";
import {useRouter} from "next/navigation";
import {useEffect,useState} from "react";

type Status = "loading" | "signed_out" | "redirecting";

export function useClerkOnboardCheck(){
    const {isLoaded,user} = useUser();
    const router = useRouter();
    const [status ,setStatus] = useState<Status>("loading");
    
    useEffect(() =>{
        if(!isLoaded)return;
        if(!user){
            setStatus("signed_out")
            return;
        }

        const checkUser = async() =>{
            try{
                const res = await fetch("/api/me", { cache: "no-store" });
                if (!res.ok) {
                    setStatus("redirecting");
                    router.replace("/onboarding");
                    return;
                }

                const data = await res.json();

                setStatus("redirecting");
                if(data.exists && data.isOnboarded){
                    router.replace("/home");
                }else{
                    router.replace("/onboarding");
                }
            }catch (err){
                console.error("Error checking user :" ,err);
                setStatus("signed_out");
            }
        };
        checkUser();
    },[isLoaded,user,router]);
    return {status};
}