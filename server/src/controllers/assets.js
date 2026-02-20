import Asset from "../models/asset.js";

const buildLocation = (latitude, longitude) => {
	if (latitude === undefined && longitude === undefined) {
		return null;
	}

	if (latitude === undefined || longitude === undefined) {
		const error = new Error("Both latitude and longitude are required");
		error.status = 400;
		throw error;
	}

	const lat = Number(latitude);
	const lng = Number(longitude);

	if (Number.isNaN(lat) || Number.isNaN(lng)) {
		const error = new Error("Latitude/longitude must be valid numbers");
		error.status = 400;
		throw error;
	}

	return {
		type: "Point",
		coordinates: [lng, lat]
	};
};

const parseOptionalNumber = (value, fieldName) => {
	if (value === undefined) return undefined;

	const parsed = Number(value);
	if (Number.isNaN(parsed)) {
		const error = new Error(`${fieldName} must be a valid number`);
		error.status = 400;
		throw error;
	}

	return parsed;
};

const parseOptionalDate = (value, fieldName) => {
	if (value === undefined) return undefined;

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		const error = new Error(`${fieldName} must be a valid date`);
		error.status = 400;
		throw error;
	}

	return parsed;
};

export const getAssets = async (req, res, next) => {
	try {

		const assets = await Asset.find().sort({ createdAt: -1 });

		res.json(assets);
	} catch (err) {
		next(err);
	}
};

export const createAsset = async (req, res, next) => {
	try {
		const {
			asset_id,
			asset_type,
			district_name,
			ward_id,
			last_maintenance_date,
			estimated_repair_cost,
			service_radius,
			latitude,
			longitude
		} = req.body;

		if (
			!asset_id ||
			!asset_type ||
			!district_name ||
			!ward_id ||
			!last_maintenance_date ||
			estimated_repair_cost === undefined ||
			service_radius === undefined
		) {
			return res.status(400).json({ message: "Missing required asset fields" });
		}

		const location = buildLocation(latitude, longitude);
		if (!location) {
			return res.status(400).json({ message: "Latitude and longitude are required" });
		}

		const asset = await Asset.create({
			asset_id,
			asset_type,
			district_name,
			ward_id,
			last_maintenance_date: parseOptionalDate(last_maintenance_date, "last_maintenance_date"),
			estimated_repair_cost: parseOptionalNumber(estimated_repair_cost, "estimated_repair_cost"),
			service_radius: parseOptionalNumber(service_radius, "service_radius"),
			location
		});

		res.status(201).json(asset);
	} catch (err) {
		if (err?.code === 11000) {
			return res.status(409).json({ message: "Asset ID already exists" });
		}
		next(err);
	}
};

export const updateAsset = async (req, res, next) => {
	try {
		const asset = await Asset.findById(req.params.id);

		if (!asset) {
			return res.status(404).json({ message: "Asset not found" });
		}

		const {
			asset_id,
			asset_type,
			district_name,
			ward_id,
			last_maintenance_date,
			estimated_repair_cost,
			service_radius,
			latitude,
			longitude
		} = req.body;

		const location = buildLocation(latitude, longitude);

		if (asset_id !== undefined) asset.asset_id = asset_id;
		if (asset_type !== undefined) asset.asset_type = asset_type;
		if (district_name !== undefined) asset.district_name = district_name;
		if (ward_id !== undefined) asset.ward_id = ward_id;

		const maintenanceDate = parseOptionalDate(last_maintenance_date, "last_maintenance_date");
		if (maintenanceDate !== undefined) asset.last_maintenance_date = maintenanceDate;

		const repairCost = parseOptionalNumber(estimated_repair_cost, "estimated_repair_cost");
		if (repairCost !== undefined) asset.estimated_repair_cost = repairCost;

		const serviceRadius = parseOptionalNumber(service_radius, "service_radius");
		if (serviceRadius !== undefined) asset.service_radius = serviceRadius;

		if (location) asset.location = location;

		await asset.save();

		res.json(asset);
	} catch (err) {
		if (err?.code === 11000) {
			return res.status(409).json({ message: "Asset ID already exists" });
		}
		next(err);
	}
};
