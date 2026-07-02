import * as auditoriaRepository from '../repositories/audit-repository.js';

async function listar(req, res, next) {
  try {
    const registros = await auditoriaRepository.listar();
    return res.status(200).json({ success: true, data: registros });
  } catch (error) {
    return next(error);
  }
}

export { listar };
