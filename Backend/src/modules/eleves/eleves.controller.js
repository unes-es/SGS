    const service = require('./eleves.service')

module.exports = {
  async getAll(req, reply) {
    const { page, limit, search, statut, classeId } = req.query
    // Was `req.query.centreId` alone for SUPER_ADMIN (no fallback) - since
    // the where clause below passes centreId straight to Prisma, an
    // undefined value there means "no filter at all", not "my own centre".
    // No frontend page has ever sent this param, so every SUPER_ADMIN
    // viewing this list has been seeing élèves from every centre mixed
    // together, with no way to narrow it down. Matches the
    // `req.query.centreId || req.user.centreId` fallback every other
    // module already uses.
    const centreId = req.user.role === 'SUPER_ADMIN'
      ? req.query.centreId || req.user.centreId
      : req.user.centreId

    const result = await service.getAll({
      centreId,
      page:     parseInt(page)  || 1,
      limit:    parseInt(limit) || 20,
      search,
      statut,
      classeId
    })
    return result
  },

  async getById(req, reply) {
    const data = await service.getById(req.params.id, req.user)
    return { data }
  },

  async create(req, reply) {
  const centreId = req.user.role === 'SUPER_ADMIN'
    ? (req.body.centreId || req.user.centreId)
    : req.user.centreId

  if (!centreId) {
    return reply.status(400).send({ success: false, message: 'centreId requis' })
  }

  const data = await service.create(req.body, centreId)
  return reply.status(201).send({ data })
  },

  async update(req, reply) {
    const data = await service.update(req.params.id, req.body, req.user)
    return { data }
  },

  async updateStatut(req, reply) {
    const data = await service.updateStatut(req.params.id, req.body.statut, req.user)
    return { data }
  },

  // Bulk import (feature addition) - parses the uploaded .xlsx here
  // (controller's job, same "parse the request" boundary as
  // updateLogo()'s file.toBuffer() in centres.controller.js) then hands
  // plain row objects to the service, which knows nothing about files.
  async import(req, reply) {
    const file = await req.file()
    if (!file) {
      return reply.status(400).send({ message: 'Aucun fichier reçu' })
    }
    const buffer = await file.toBuffer()

    const ExcelJS = require('exceljs')
    const workbook = new ExcelJS.Workbook()
    try {
      await workbook.xlsx.load(buffer)
    } catch {
      return reply.status(400).send({ message: 'Fichier Excel invalide' })
    }

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return reply.status(400).send({ message: 'Aucune feuille trouvée dans le fichier' })
    }

    const headerRow = worksheet.getRow(1)
    const headers = []
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber] = String(cell.value || '')
        .trim().toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
    })

    const rows = []
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return // header
      const obj = {}
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = headers[colNumber]
        if (key) obj[key] = cell.value
      })
      // Skip fully-blank rows (trailing empty rows in the sheet) rather
      // than reporting them as failures with no useful column to blame.
      if (Object.values(obj).some(v => v !== null && v !== undefined && v !== '')) {
        rows.push(obj)
      }
    })

    const centreId = req.user.role === 'SUPER_ADMIN'
      ? (req.query.centreId || req.user.centreId)
      : req.user.centreId

    const report = await service.importFromRows(rows, centreId)
    return { data: report }
  },

  async linkParent(req, reply) {
    const data = await service.linkParent(req.params.id, req.body, req.user)
    return { data }
  },

  async unlinkParent(req, reply) {
    const data = await service.unlinkParent(req.params.id, req.user)
    return { data }
  }
}