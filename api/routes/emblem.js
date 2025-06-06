const express = require("express");
const Emblem = require("../models/Emblem");

const router = express.Router();

/**
 * @swagger
 * /emblem:
 *   get:
 *     summary: Returns all emblems
 *     parameters:
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by source
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Exact match by ID
 *     responses:
 *       200:
 *         description: List of emblems
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.available !== undefined) query.available = req.query.available === "true";
    if (req.query.source) query.source = new RegExp(req.query.source, "i");
    if (req.query.name) query.name = new RegExp(req.query.name, "i");
    if (req.query.id) query.id = req.query.id;

    const emblems = await Emblem.find(query);
    if (req.query.id && emblems.length === 0) return res.status(404).send("Emblem not found.");

    res.json(emblems);
  } catch (err) {
    console.error("Error fetching emblems:", err);
    res.status(500).send("Failed to fetch emblems.");
  }
});

router.get("/", async (req, res) => {
  try {
    // --- FIX: support ?search=xyz like old version ---
    if (req.query.search && !req.query.name) {
      req.query.name = req.query.search;
    }

    const query = {};
    if (req.query.available !== undefined) query.available = req.query.available === "true";
    if (req.query.source) query.source = new RegExp(req.query.source, "i");
    if (req.query.name) query.name = new RegExp(req.query.name, "i");
    if (req.query.id) query.id = req.query.id;

    // --- LIMIT: for autocomplete, never more than 25! ---
    const emblems = await Emblem.find(query).limit(25);
    if (req.query.id && emblems.length === 0) return res.status(404).send("Emblem not found.");

    res.json(emblems);
  } catch (err) {
    console.error("Error fetching emblems:", err);
    res.status(500).send("Failed to fetch emblems.");
  }
});

module.exports = router;
