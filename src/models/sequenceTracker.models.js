import mongoose from "mongoose";
import { type } from "os";

const sequenceTrackerSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true
    },
    orderNumber: {
        type: Number,
        required: true,
        deault: 0,
    }
});

const sequenceTracker = mongoose.model("SequenceTracker", sequenceTrackerSchema);
export default sequenceTracker;