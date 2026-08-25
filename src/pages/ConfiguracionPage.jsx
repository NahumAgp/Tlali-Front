import { useMemo, useState } from 'react'
import {
  createCropFromName,
  getCropAgeDays,
  getCropStage,
  getCropStageTiming,
  getCropParameters,
  loadActiveCropId,
  loadCropSettings,
  loadNodeAssignments,
  saveActiveCropId,
  saveCropSettings,
  saveNodeAssignments,
  SENSOR_PARAMETERS,
} from '../lib/cropSettings.js'
import { DashboardNav } from '../components/dashboard/DashboardWidgets.jsx'
import useDashboardData from '../hooks/useDashboardData.js'

export default function ConfiguracionPage({ auth, navigate, route }) {
  const isAdmin = auth.user?.role === 'SUPER_ADMIN'
  const { firebaseNodes } = useDashboardData(auth)
  const [crops, setCrops] = useState(() => loadCropSettings())
  const [activeCropId, setActiveCropId] = useState(() => loadActiveCropId())
  const [selectedCropId, setSelectedCropId] = useState(() => loadActiveCropId())
  const [nodeAssignments, setNodeAssignments] = useState(() => loadNodeAssignments())
  const [newCropName, setNewCropName] = useState('')
  const [newNodeName, setNewNodeName] = useState('')
  const selectedCrop = useMemo(
    () => crops.find((crop) => crop.id === selectedCropId) ?? crops[0],
    [crops, selectedCropId],
  )
  const selectedStageTiming = getCropStageTiming(selectedCrop)
  const selectedStage = selectedCrop?.stages?.find((stage) => stage.id === selectedCrop?.activeStageId) ?? getCropStage(selectedCrop)
  const effectiveStage = selectedStageTiming.stage
  const selectedCropAgeDays = getCropAgeDays(selectedCrop)
  const selectedParameters = selectedStage?.parameters ?? getCropParameters(selectedCrop)
  const hardwareRows = useMemo(() => {
    const sensorNodes = firebaseNodes
      .filter((node) => node.type === 'sensor' || node.node?.toLowerCase().includes('npk'))
      .map((node) => node.node)
      .filter(Boolean)
    return Array.from(new Set([...nodeAssignments.map((assignment) => assignment.node), ...sensorNodes]))
  }, [firebaseNodes, nodeAssignments])

  function persistCrops(nextCrops) {
    setCrops(saveCropSettings(nextCrops))
  }

  function persistNodeAssignments(nextAssignments) {
    setNodeAssignments(saveNodeAssignments(nextAssignments))
  }

  function selectActiveCrop(cropId) {
    setActiveCropId(cropId)
    setSelectedCropId(cropId)
    saveActiveCropId(cropId)
  }

  function addCrop(event) {
    event.preventDefault()
    if (!newCropName.trim()) return
    const crop = createCropFromName(newCropName)
    persistCrops([...crops, crop])
    setSelectedCropId(crop.id)
    setNewCropName('')
  }

  function addNodeAssignment(event) {
    event.preventDefault()
    if (!newNodeName.trim() || !isAdmin) return
    upsertNodeAssignment(newNodeName.trim(), {
      cropId: selectedCrop?.id ?? crops[0]?.id,
      greenhouse: 'Invernadero 1',
      area: 'Zona de cultivo',
    })
    setNewNodeName('')
  }

  function updateRange(parameterKey, field, value) {
    persistCrops(crops.map((crop) => {
      if (crop.id !== selectedCrop.id) return crop
      const nextStages = crop.stages.map((stage) => {
        if (stage.id !== selectedStage.id) return stage
        return {
          ...stage,
          parameters: {
            ...stage.parameters,
            [parameterKey]: {
              ...(stage.parameters[parameterKey] ?? {}),
              [field]: value,
            },
          },
        }
      })
      return {
        ...crop,
        stages: nextStages,
      }
    }))
  }

  function updateActiveStage(stageId) {
    persistCrops(crops.map((crop) => (
      crop.id === selectedCrop.id
        ? { ...crop, activeStageId: stageId, activeStageStartedAt: todayLocalDate() }
        : crop
    )))
  }

  function updateStageStartDate(value) {
    persistCrops(crops.map((crop) => (
      crop.id === selectedCrop.id
        ? { ...crop, activeStageStartedAt: value || todayLocalDate() }
        : crop
    )))
  }

  function updateCropStartDate(value) {
    persistCrops(crops.map((crop) => (
      crop.id === selectedCrop.id
        ? { ...crop, cropStartedAt: value || todayLocalDate() }
        : crop
    )))
  }

  function upsertNodeAssignment(nodeName, changes) {
    const exists = nodeAssignments.some((assignment) => assignment.node.toLowerCase() === nodeName.toLowerCase())
    if (exists) {
      persistNodeAssignments(nodeAssignments.map((assignment) => (
        assignment.node.toLowerCase() === nodeName.toLowerCase()
          ? { ...assignment, ...changes, node: nodeName }
          : assignment
      )))
      return
    }
    persistNodeAssignments([
      ...nodeAssignments,
      {
        node: nodeName,
        cropId: crops[0]?.id ?? 'jitomate',
        greenhouse: 'Invernadero 1',
        area: 'Zona de cultivo',
        ...changes,
      },
    ])
  }

  function removeNodeAssignment(nodeName) {
    if (!isAdmin) return
    persistNodeAssignments(nodeAssignments.filter((assignment) => assignment.node.toLowerCase() !== nodeName.toLowerCase()))
  }

  function getAssignment(nodeName) {
    return nodeAssignments.find((assignment) => assignment.node.toLowerCase() === nodeName.toLowerCase()) ?? {
      node: nodeName,
      cropId: activeCropId,
      greenhouse: 'Invernadero 1',
      area: 'Zona de cultivo',
    }
  }

  return (
    <div className="dashboard-shell min-h-screen text-tlali-ink">
      <DashboardNav auth={auth} hasReadings navigate={navigate} route={route} showReport={false} />
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-7 lg:px-10 lg:py-7">
        <section className="paper-card px-5 py-6 sm:px-7">
          <p className="eyebrow">Configuración</p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Cultivos, rangos y nodos</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-tlali-muted sm:text-base">
                Define qué cultivo maneja cada nodo de Firebase y qué rangos debe usar para generar alertas.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e1dbcd] bg-[#fcf8f0] p-4">
              <p className="text-xs font-semibold text-tlali-muted">Cultivo por defecto</p>
              <select className="tlali-input mt-2" onChange={(event) => selectActiveCrop(event.target.value)} value={activeCropId}>
                {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
              </select>
              <p className="mt-2 text-xs text-tlali-muted">Se usa cuando un nodo todavía no tiene asignación propia.</p>
            </div>
          </div>
        </section>

        <section className="mt-4 paper-card overflow-hidden">
          <div className="border-b border-[#e1dbcd] px-4 py-4 sm:px-5">
            <p className="eyebrow">Hardware</p>
            <h2 className="mt-1 text-xl font-bold">Asignación de nodos Firebase</h2>
            <p className="mt-1 max-w-3xl text-sm text-tlali-muted">
              Aquí se define la comparación: cada nodo se liga a un cultivo, invernadero y zona. Las alertas salen de los rangos del cultivo asignado.
            </p>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="bg-[#f8f3e9] text-[#687169]">
                <tr>
                  <th>Nodo Firebase</th>
                  <th>Cultivo que controla</th>
                  <th>Invernadero</th>
                  <th>Zona</th>
                  <th>Comparación</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {hardwareRows.map((nodeName) => {
                  const assignment = getAssignment(nodeName)
                  const crop = crops.find((item) => item.id === assignment.cropId) ?? crops[0]
                  return (
                    <tr className="border-t border-[#ece6da]" key={nodeName}>
                      <td className="font-semibold">{nodeName}</td>
                      <td>
                        <select
                          className="tlali-input min-w-40"
                          disabled={!isAdmin}
                          onChange={(event) => upsertNodeAssignment(nodeName, { cropId: event.target.value })}
                          value={assignment.cropId}
                        >
                          {crops.map((cropOption) => <option key={cropOption.id} value={cropOption.id}>{cropOption.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          className="tlali-input min-w-40"
                          disabled={!isAdmin}
                          onChange={(event) => upsertNodeAssignment(nodeName, { greenhouse: event.target.value })}
                          value={assignment.greenhouse}
                        />
                      </td>
                      <td>
                        <input
                          className="tlali-input min-w-40"
                          disabled={!isAdmin}
                          onChange={(event) => upsertNodeAssignment(nodeName, { area: event.target.value })}
                          value={assignment.area}
                        />
                      </td>
                      <td className="text-tlali-muted">
                        Usa <span className="font-bold text-tlali-ink">{crop?.name ?? 'cultivo'}</span>
                        {crop?.activeStageId && <span> · {getCropStage(crop)?.name}</span>}.
                      </td>
                      <td className="text-right">
                        <button className="secondary-button" disabled={!isAdmin} onClick={() => removeNodeAssignment(nodeName)} type="button">Quitar</button>
                      </td>
                    </tr>
                  )
                })}
                {!hardwareRows.length && (
                  <tr>
                    <td className="py-8 text-center text-tlali-muted" colSpan="6">Aún no hay nodos detectados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isAdmin && (
            <form className="flex flex-wrap items-end gap-3 border-t border-[#e1dbcd] px-4 py-4 sm:px-5" onSubmit={addNodeAssignment}>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Agregar nodo manualmente
                <input className="tlali-input min-w-64" onChange={(event) => setNewNodeName(event.target.value)} placeholder="Ej. tlali-npk-02" value={newNodeName} />
              </label>
              <button className="primary-button" type="submit">Asignar nodo</button>
            </form>
          )}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="paper-card p-4 sm:p-5">
            <p className="eyebrow">Cultivos</p>
            <div className="mt-4 grid gap-2">
              {crops.map((crop) => (
                <button
                  className={`rounded-xl border px-4 py-3 text-left transition ${selectedCropId === crop.id ? 'border-tlali-jade-dark bg-[#d8eee7]' : 'border-[#e1dbcd] bg-[#fcf8f0]'}`}
                  key={crop.id}
                  onClick={() => setSelectedCropId(crop.id)}
                  type="button"
                >
                  <span className="block font-bold">{crop.name}</span>
                  <span className="mt-1 block text-xs text-tlali-muted">{crop.id === activeCropId ? 'Cultivo por defecto' : 'Plantilla disponible'}</span>
                </button>
              ))}
            </div>

            {isAdmin ? (
              <form className="mt-5 border-t border-tlali-line pt-5" onSubmit={addCrop}>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Nuevo cultivo
                  <input className="tlali-input" onChange={(event) => setNewCropName(event.target.value)} placeholder="Ej. Pepino" value={newCropName} />
                </label>
                <button className="primary-button mt-3 w-full" type="submit">Crear cultivo</button>
              </form>
            ) : (
              <p className="mt-5 rounded-xl border border-[#ead5a8] bg-[#fff5dc] p-3 text-sm text-[#75501d]">
                Tu usuario puede elegir cultivo por defecto, pero los rangos los modifica un administrador.
              </p>
            )}
          </aside>

          <article className="paper-card overflow-hidden">
            <div className="border-b border-[#e1dbcd] px-4 py-4 sm:px-5">
              <p className="eyebrow">Parámetros</p>
              <h2 className="mt-1 text-xl font-bold">{selectedCrop?.name ?? 'Cultivo'}</h2>
              <p className="mt-1 text-sm text-tlali-muted">{selectedCrop?.description}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {selectedCrop?.stages?.map((stage) => (
                  <button
                    className={`min-h-[112px] rounded-xl border px-3 py-3 text-left transition ${selectedStage?.id === stage.id ? 'border-tlali-jade-dark bg-[#d8eee7]' : 'border-[#e1dbcd] bg-[#fcf8f0]'}`}
                    disabled={!isAdmin}
                    key={stage.id}
                    onClick={() => updateActiveStage(stage.id)}
                    type="button"
                  >
                    <span className="block text-sm font-black">{stage.name}</span>
                    <span className="mt-2 block text-xs font-bold text-[#4f6258]">{stage.durationDays} días</span>
                    <span className="mt-1 block text-xs leading-5 text-tlali-muted">{stage.from} → {stage.to}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold text-[#687169]">
                Etapa configurada: <span className="text-tlali-ink">{selectedStage?.name}</span>
                {effectiveStage?.id !== selectedStage?.id && <span> · alertas usando {effectiveStage?.name}</span>}
              </p>
              <div className="mt-3 grid gap-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] px-4 py-3 lg:grid-cols-[220px_220px_1fr] lg:items-end">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Inicio del cultivo
                  <input
                    className="tlali-input"
                    disabled={!isAdmin}
                    max={todayLocalDate()}
                    onChange={(event) => updateCropStartDate(event.target.value)}
                    type="date"
                    value={selectedCrop?.cropStartedAt ?? todayLocalDate()}
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Inicio de etapa
                  <input
                    className="tlali-input"
                    disabled={!isAdmin}
                    max={todayLocalDate()}
                    onChange={(event) => updateStageStartDate(event.target.value)}
                    type="date"
                    value={selectedCrop?.activeStageStartedAt ?? todayLocalDate()}
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-4">
                  <StageCounter label="Edad del cultivo" value={selectedCropAgeDays} />
                  <StageCounter label="Desde inicio de etapa" value={selectedStageTiming.totalDaysElapsed} />
                  <StageCounter label="En etapa calculada" value={selectedStageTiming.daysElapsed} />
                  <StageCounter label="Límite de etapa" value={selectedStageTiming.maxDays} />
                </div>
              </div>
              {selectedStageTiming.isAutoAdvanced && (
                <div className="mt-3 rounded-xl border border-[#ead5a8] bg-[#fff5dc] px-4 py-3 text-sm text-[#75501d]">
                  El calendario ya avanzó desde {selectedStageTiming.configuredStage.name} hacia {selectedStageTiming.stage.name}. Los rangos y alertas usan la etapa actual calculada.
                </div>
              )}
              {selectedStage?.guidance && (
                <div className="mt-3 rounded-xl border border-[#e1dbcd] bg-[#fcf8f0] px-4 py-3">
                  <p className="text-xs font-black uppercase text-[#687169]">Manejo recomendado</p>
                  <p className="mt-2 text-sm leading-6 text-tlali-muted">{selectedStage.guidance}</p>
                </div>
              )}
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-[#f8f3e9] text-[#687169]">
                  <tr>
                    <th>Sensor</th>
                    <th>Unidad</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {SENSOR_PARAMETERS.map((parameter) => {
                    const range = selectedParameters?.[parameter.key] ?? { min: parameter.min, max: parameter.max }
                    return (
                      <tr className="border-t border-[#ece6da]" key={parameter.key}>
                        <td className="font-semibold">{parameter.label}</td>
                        <td>{parameter.unit}</td>
                        <td>
                          <input
                            className="tlali-input max-w-32"
                            disabled={!isAdmin}
                            onChange={(event) => updateRange(parameter.key, 'min', event.target.value)}
                            step="any"
                            type="number"
                            value={range.min}
                          />
                        </td>
                        <td>
                          <input
                            className="tlali-input max-w-32"
                            disabled={!isAdmin}
                            onChange={(event) => updateRange(parameter.key, 'max', event.target.value)}
                            step="any"
                            type="number"
                            value={range.max}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}

function StageCounter({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e1dbcd] bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase text-tlali-muted">{label}</p>
      <p className="mt-1 text-2xl font-black text-tlali-jade-dark">{value}</p>
    </div>
  )
}

function todayLocalDate() {
  return new Date().toLocaleDateString('en-CA')
}
