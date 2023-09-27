import express from "express";
import { requireAdminSignin } from "../helper/login.js";
import { CompanyModel } from "../model/company.js";

const companyRouter = express.Router();

companyRouter.post("/", requireAdminSignin, async (req, res) => {
  try {
    const user = req.user;
    const body = req.body;
    const company = new CompanyModel(body);
    await company.save();
    user.managedBy = company._id;
    await user.save();
  } catch (error) {
    return res.status(401).json({ error: "lỗi tạo công ty" });
  }
});

companyRouter.put("/:id", requireAdminSignin, async (req, res) => {
  try {
    const body = req.body;
    const id = req.params.id;
    await CompanyModel.findByIdAndUpdate(id, body);
  } catch (error) {
    return res.status(401).json({ error: "lỗi chỉnh sửa công ty" });
  }
});

export { companyRouter };
