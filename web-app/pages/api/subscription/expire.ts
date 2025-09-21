import { NextApiRequest, NextApiResponse } from "next";
import { supabaseService } from "@/app/lib/supabaseService";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    if (req.method !== "POST"){
        return res.status(405).json({ error: "Method not allowed"});
    }

    try{
        const {subscriptionId} = req.body;

        if(!subscriptionId) 
            return res.status(400).json({error: "Missing subscription id"});

        const {error} = await supabaseService
        .from("subscriptions")
        .update({status: 1})
        .eq("id", subscriptionId);

        if(error){
            return res.status(500).json({error: error.message});
        }

        return res.status(200).json({ success: true});
    }catch(err){
        return res.status(500).json({error: "Unexpected Server Error"});
    }
    
}