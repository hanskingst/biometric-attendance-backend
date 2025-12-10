import { Router } from "express";
import { Enrollment, Course, Attendance } from "../models/index.js";

const router = Router();

// Mock school location
const SCHOOL_LAT = 4.1533;
const SCHOOL_LON = 9.2927;
const RADIUS_METERS = 100;

// Simple distance checker
function isWithinRadius(userLat, userLon) {
  const latDiff = Math.abs(userLat - SCHOOL_LAT);
  const lonDiff = Math.abs(userLon - SCHOOL_LON);

  // Rough conversion: 0.0001 ≈ 11 meters
  const latMeters = latDiff * 111000;
  const lonMeters = lonDiff * 111000;

  const distance = Math.sqrt(latMeters ** 2 + lonMeters ** 2);

  return distance <= RADIUS_METERS;
}

router.post("/attendance", async (req, res) => {
  const { stdId, courseID, fingerprinthash, latitude, longitude } = req.body;

  try {
    const isEnrolled = await Enrollment.findOne({
      where: { stdId, courseID }
    });

    if (!isEnrolled) {
      return res.status(403).json({ message: "Student not enrolled in this course" });
    }

    const course = await Course.findByPk(courseID);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    //  Location check (simple radius logic)
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required" });
    }

    // Check time and location
    const insideSchool = isWithinRadius(
      parseFloat(latitude),
      parseFloat(longitude)
    );
    const now = new Date();
    if (now < new Date(course.startTime) || now > new Date(course.endTime)) {
      return res.status(400).json({ message: "Attendance outside allowed time and outside school" });
    }

    if(!insideSchool){
      return res.status(400).json({message:"location outside school"});
    }

    //Fingerprint presence check (simple mock)
    if (!fingerprinthash || fingerprinthash.length < 5) {
      return res.status(400).json({ message: "Fingerprint scan required" });
    }


    const attendance = await Attendance.create({
      stdId,
      courseID,
      fingerprinthash,
      latitude,
      longitude,
      timestamp: now,
      valid: true
    });

    return res.json({ message: "Attendance recorded", attendance });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
