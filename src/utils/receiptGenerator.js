import sequenceTracker from "../models/sequenceTracker.models.js";

export const generateInternalReceiptId = async() => {
    const today = new Date();
    const formattedDate = today.toISOString().slice(0,10).replace(/-/g,"");

    try {
        const result = await sequenceTracker.findOneAndUpdate(
            {date: formattedDate},
            {$inc: {orderNumber:1}},
            {new:true, upsert: true, setDefaultsOnInsert: true}
        );
        return `VIN-${formattedDate}-${result.orderNumber.toString().padStart(3,"0")}`;
    } catch (error) {
        console.error("Error generating receipt ID:", error);
        throw error; // Let the caller handle the error
    }
}