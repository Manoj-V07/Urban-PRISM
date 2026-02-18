import Asset from "../models/asset.js";


/**
 * Create Asset (Admin Only)
 * POST /api/assets
 */
export const createAsset = async (req, res, next) => {
  try {

    const asset = await Asset.create(req.body);

    res.status(201).json({
      success: true,
      asset
    });

  } catch (err) {
    next(err);
  }
};



/**
 * Get All Assets
 * GET /api/assets
 */
export const getAssets = async (req, res, next) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const assets = await Asset.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Asset.countDocuments();

    res.json({
      success: true,
      total,
      page,
      assets
    });

  } catch (err) {
    next(err);
  }
};



/**
 * Get Single Asset
 * GET /api/assets/:id
 */
export const getAssetById = async (req, res, next) => {
  try {

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found"
      });
    }

    res.json({
      success: true,
      asset
    });

  } catch (err) {
    next(err);
  }
};



/**
 * Update Asset (Admin Only)
 * PUT /api/assets/:id
 */
export const updateAsset = async (req, res, next) => {
  try {

    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found"
      });
    }

    res.json({
      success: true,
      asset
    });

  } catch (err) {
    next(err);
  }
};



/**
 * Delete Asset (Admin Only)
 * DELETE /api/assets/:id
 */
export const deleteAsset = async (req, res, next) => {
  try {

    const asset = await Asset.findByIdAndDelete(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found"
      });
    }

    res.json({
      success: true,
      message: "Asset deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};



