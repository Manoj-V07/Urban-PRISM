import User from "../models/user.js";

// ── Category → Worker-type mapping (keywords → workerCategory) ──
const CATEGORY_KEYWORD_MAP = [
  { keywords: ["streetlight", "street light", "light", "lamp", "electric", "power"], workerCategory: "Electrician" },
  { keywords: ["water supply", "water", "pipe", "plumb", "tap", "leak"], workerCategory: "Plumber" },
  { keywords: ["road", "pothole", "pavement", "footpath", "bridge", "crack"], workerCategory: "Road Maintenance" },
  { keywords: ["drain", "drainage", "sewer", "sewage", "overflow", "blockage", "clog", "stagnation"], workerCategory: "Drainage Worker" },
  { keywords: ["garbage", "waste", "trash", "sanitation", "litter", "dump", "debris", "cleaning"], workerCategory: "Sanitation Worker" },
];

export const mapGrievanceCategoryToWorker = (grievanceCategory) => {
  if (!grievanceCategory) return null;
  const lower = grievanceCategory.toLowerCase();

  for (const entry of CATEGORY_KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) return entry.workerCategory;
    }
  }

  return null; // no match → any worker is eligible
};

// ── Admin: list all field workers ──
export const listFieldWorkers = async (req, res, next) => {
  try {
    const { verified, category } = req.query;

    const filter = { role: "FieldWorker" };
    if (verified !== undefined) filter.isVerified = verified === "true";
    if (category) filter.workerCategory = category;

    const workers = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(workers);
  } catch (err) {
    next(err);
  }
};

// ── Admin: verify / approve a field worker ──
export const verifyWorker = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);

    if (!worker || worker.role !== "FieldWorker")
      return res.status(404).json({ message: "Field worker not found" });

    worker.isVerified = true;
    await worker.save();

    res.json({ message: "Worker verified successfully", worker });
  } catch (err) {
    next(err);
  }
};

// ── Admin: reject / deactivate a field worker ──
export const rejectWorker = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);

    if (!worker || worker.role !== "FieldWorker")
      return res.status(404).json({ message: "Field worker not found" });

    worker.isVerified = false;
    await worker.save();

    res.json({ message: "Worker deactivated", worker });
  } catch (err) {
    next(err);
  }
};

// ── Admin: get eligible workers for a grievance ──
export const getEligibleWorkers = async (req, res, next) => {
  try {
    const { category, longitude, latitude } = req.query;

    const workerCategory = mapGrievanceCategoryToWorker(category);

    const filter = {
      role: "FieldWorker",
      isVerified: true
    };

    if (workerCategory) filter.workerCategory = workerCategory;

    let workers;

    // If coordinates available, try sorting by proximity
    if (longitude && latitude) {
      try {
        workers = await User.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
              },
              distanceField: "distance",
              spherical: true,
              query: filter
            }
          },
          { $project: { password: 0 } },
          { $sort: { activeTaskCount: 1, distance: 1 } },
          { $limit: 20 }
        ]);
      } catch {
        // $geoNear can fail if no docs have location, fall through
        workers = [];
      }
    }

    // Fallback: if geoNear returned nothing or no coords given, use plain find
    if (!workers || workers.length === 0) {
      workers = await User.find(filter)
        .select("-password")
        .sort({ activeTaskCount: 1 })
        .limit(20);
    }

    res.json(workers);
  } catch (err) {
    next(err);
  }
};

// ── Field worker: update own location ──
export const updateLocation = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude)
      return res.status(400).json({ message: "Coordinates required" });

    await User.findByIdAndUpdate(req.user._id, {
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    });

    res.json({ message: "Location updated" });
  } catch (err) {
    next(err);
  }
};
