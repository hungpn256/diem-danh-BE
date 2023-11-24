import express from "express";
import { requireAdminSignin } from "../helper/login.js";
import { CompanyModel } from "../model/company.js";
import { DepartmentModel } from "../model/department.js";

const companyRouter = express.Router();

companyRouter.post("/department", requireAdminSignin, async (req, res) => {
  try {
    const user = req.user;
    const body = req.body;
    const department = new DepartmentModel({
      ...body,
      company: user.managedBy._id,
    });
    await department.save();
    return res.status(200).json({ department });
  } catch (error) {
    console.log(
      "🚀 ~ file: company.js:19 ~ companyRouter.post ~ error:",
      error
    );
    return res.status(401).json({ error: "lỗi tạo bộ phận" });
  }
});

companyRouter.get("/department", requireAdminSignin, async (req, res) => {
  try {
    const user = req.user;
    const departments = await DepartmentModel.find({
      company: user.managedBy._id,
    });
    return res.status(200).json({ departments });
  } catch (error) {
    console.log("🚀 ~ file: company.js:30 ~ companyRouter.get ~ error:", error);
    return res.status(401).json({ error: "lỗi tạo bộ phận" });
  }
});

companyRouter.delete(
  "/department/:_id",
  requireAdminSignin,
  async (req, res) => {
    try {
      const _id = req.params._id;
      await DepartmentModel.findByIdAndDelete(_id);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(401).json({ error: "lỗi xoá bộ phận" });
    }
  }
);

companyRouter.put("/department/:_id", requireAdminSignin, async (req, res) => {
  try {
    const _id = req.params._id;
    await DepartmentModel.findByIdAndUpdate(_id, {
      ...req.body,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(401).json({ error: "lỗi sửa bộ phận" });
  }
});

companyRouter.post("/", requireAdminSignin, async (req, res) => {
  try {
    const user = req.user;
    const body = req.body;
    const company = new CompanyModel({ ...body, managedBy: user._id });
    await company.save();
    user.managedBy = company._id;
    await user.save();
    return res.status(200).json({ company });
  } catch (error) {
    return res.status(401).json({ error: "lỗi tạo công ty" });
  }
});

companyRouter.put("/:id", requireAdminSignin, async (req, res) => {
  try {
    const body = req.body;
    const id = req.params.id;
    const company = await CompanyModel.findByIdAndUpdate(id, body);
    return res.status(200).json({ company });
  } catch (error) {
    return res.status(401).json({ error: "lỗi chỉnh sửa công ty" });
  }
});

export { companyRouter };
