import Asset from "../models/asset.js";

export const getAssets = async (req, res) => {

	const assets = await Asset.find().sort({ createdAt: -1 });

	res.json(assets);
};
