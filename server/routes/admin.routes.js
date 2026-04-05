const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
const {
  getPendingUsersController,
  approveUserController,
  rejectUserController,
  listStudentsController,
  updateRoleController,
  addStudentController,
} = require('../controllers/admin.controller');

// All admin routes: require auth first, then admin role check
router.use(authMiddleware, adminMiddleware);

router.get('/pending',              getPendingUsersController);
router.post('/approve/:userId',     approveUserController);
router.post('/reject/:userId',      rejectUserController);
router.get('/students',             listStudentsController);
router.put('/role/:userId',         updateRoleController);
router.post('/add-student',         addStudentController);

module.exports = router;
