// Configuración del cuestionario de "Regularización de datos del personal".
// Una sola fuente de verdad que consumen el wizard (UI), el server action
// (guardar/finalizar) y la ficha de Gerencia.
//
// Secciones 1 y 2  → columnas de employee_records (store: "column").
// Secciones 3 a 7  → survey_answers jsonb (store: "survey").
// "children" y "assets" son listas repetibles con tabla propia.

export type FieldKind =
  | "text"
  | "textarea"
  | "date"
  | "select"
  | "yesno"
  | "children"
  | "assets";

export type Field = {
  key: string;
  label: string;
  kind: FieldKind;
  store: "column" | "survey" | "special";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  help?: string;
  // Muestra el campo solo si otro campo tiene cierto valor.
  dependsOn?: { key: string; equals: string | boolean };
};

export type Section = {
  id: number;
  title: string;
  description?: string;
  fields: Field[];
};

const RATING = ["Muy bueno", "Bueno", "Regular", "Malo"];

export const SECTIONS: Section[] = [
  {
    id: 1,
    title: "Datos personales y familiares",
    description:
      "Tus datos de contacto e identificación. Los marcados con * son obligatorios para finalizar.",
    fields: [
      { key: "first_names", label: "Nombres", kind: "text", store: "column", required: true },
      { key: "last_name_p", label: "Apellido paterno", kind: "text", store: "column" },
      { key: "last_name_m", label: "Apellido materno", kind: "text", store: "column" },
      { key: "birth_date", label: "Fecha de nacimiento", kind: "date", store: "column", required: true },
      { key: "phone", label: "Número de celular personal", kind: "text", store: "column", required: true },
      { key: "ci_number", label: "Número de carnet de identidad", kind: "text", store: "column", required: true },
      { key: "ci_ext", label: "Lugar de expedición", kind: "text", store: "column", required: true, placeholder: "Ej. La Paz" },
      { key: "residence_city", label: "Ciudad de residencia actual", kind: "text", store: "column", required: true },
      { key: "home_address", label: "Dirección de domicilio actual", kind: "text", store: "column" },
      {
        key: "marital_status",
        label: "Estado civil",
        kind: "select",
        store: "column",
        required: true,
        options: ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión libre", "Otro"],
      },
      { key: "emergency_name", label: "Contacto de emergencia (nombre)", kind: "text", store: "column", required: true },
      { key: "emergency_phone", label: "Contacto de emergencia (teléfono)", kind: "text", store: "column", required: true },
      { key: "children", label: "Hijos", kind: "children", store: "special", help: "Agregá nombre y edad de cada hijo/a (opcional)." },
      { key: "has_dependents", label: "¿Tiene personas que dependan económicamente de usted?", kind: "yesno", store: "column" },
      { key: "dependents_detail", label: "¿Quiénes?", kind: "text", store: "column", dependsOn: { key: "has_dependents", equals: true } },
      {
        key: "shirt_size",
        label: "Talla de polera / chaqueta / uniforme",
        kind: "select",
        store: "column",
        options: ["XS", "S", "M", "L", "XL", "XXL", "Otro"],
      },
      {
        key: "health_condition",
        label: "Condición de salud o dato de emergencia que la empresa deba conocer",
        kind: "textarea",
        store: "column",
        help: "Voluntario y reservado.",
      },
    ],
  },
  {
    id: 2,
    title: "Datos laborales y contractuales",
    fields: [
      { key: "hire_date", label: "Fecha en que inició en la empresa", kind: "date", store: "column", required: true },
      { key: "start_branch", label: "Ciudad o sucursal donde inició", kind: "text", store: "column", required: true },
      { key: "start_position", label: "Puesto con el que empezó", kind: "text", store: "column", required: true },
      { key: "current_position", label: "Puesto que ocupa actualmente", kind: "text", store: "column", required: true },
      { key: "department", label: "Área o departamento al que pertenece", kind: "text", store: "column", required: true },
      { key: "immediate_boss", label: "Nombre de su jefe inmediato actual", kind: "text", store: "column", required: true },
      { key: "prior_roles", label: "¿Tuvo otros cargos dentro de la empresa? Detallar", kind: "textarea", store: "column" },
      { key: "has_contract", label: "¿Tiene contrato firmado actualmente?", kind: "yesno", store: "column", required: true },
      {
        key: "contract_type",
        label: "Tipo de contrato",
        kind: "select",
        store: "column",
        required: true,
        options: ["Indefinido", "Plazo fijo", "Eventual", "Consultoría", "Otro"],
        dependsOn: { key: "has_contract", equals: true },
      },
      { key: "no_contract_since", label: "Si no tiene contrato firmado, ¿desde cuándo trabaja sin contrato?", kind: "text", store: "column", dependsOn: { key: "has_contract", equals: false } },
      { key: "has_memo", label: "¿Cuenta con memorándum, designación formal o documento de cambio de cargo?", kind: "yesno", store: "column" },
      { key: "knows_duties", label: "¿Conoce claramente sus funciones y responsabilidades?", kind: "yesno", store: "column" },
      { key: "received_manual", label: "¿Recibió manual de funciones o explicación formal de su puesto?", kind: "yesno", store: "column" },
      { key: "duties_match", label: "¿Sus funciones actuales coinciden con su cargo?", kind: "yesno", store: "column" },
      { key: "staff_in_charge", label: "¿Tiene personal a su cargo? Nombres y cargos", kind: "textarea", store: "column" },
    ],
  },
  {
    id: 3,
    title: "Funciones, desempeño y capacitación",
    description: "Preguntas abiertas (opcionales).",
    fields: [
      { key: "s3_daily", label: "Actividades diarias principales", kind: "textarea", store: "survey" },
      { key: "s3_weekly", label: "Actividades semanales principales", kind: "textarea", store: "survey" },
      { key: "s3_monthly", label: "Actividades mensuales principales", kind: "textarea", store: "survey" },
      { key: "s3_best", label: "¿Qué funciones realiza mejor?", kind: "textarea", store: "survey" },
      { key: "s3_support", label: "¿En qué funciones considera que necesita apoyo?", kind: "textarea", store: "survey" },
      { key: "s3_training", label: "¿Qué capacitación le gustaría recibir?", kind: "textarea", store: "survey" },
      { key: "s3_process", label: "¿Qué procesos deberían mejorarse en su área?", kind: "textarea", store: "survey" },
      { key: "s3_difficulties", label: "¿Qué dificultades tiene para cumplir mejor su trabajo?", kind: "textarea", store: "survey" },
      { key: "s3_tools", label: "¿Qué herramientas, equipos o información necesita para mejorar su desempeño?", kind: "textarea", store: "survey" },
      { key: "s3_recommend", label: "¿Qué recomendación daría para mejorar su puesto de trabajo?", kind: "textarea", store: "survey" },
    ],
  },
  {
    id: 4,
    title: "Condiciones de trabajo, recursos y equipos",
    fields: [
      { key: "s4_materials", label: "¿Cuenta con los materiales necesarios para realizar su trabajo?", kind: "yesno", store: "survey" },
      { key: "s4_equipment", label: "¿Cuenta con equipos, herramientas o sistemas suficientes?", kind: "yesno", store: "survey" },
      { key: "s4_corp_number", label: "Número corporativo asignado (indicar número y si está activo)", kind: "text", store: "survey" },
      { key: "s4_work_number", label: "Si no tiene corporativo, ¿con qué número trabaja? ¿Autoriza su uso laboral?", kind: "text", store: "survey" },
      { key: "s4_corp_phone", label: "Celular corporativo / chip / línea de la empresa (estado)", kind: "text", store: "survey" },
      { key: "assets", label: "Equipos y bienes asignados", kind: "assets", store: "special", help: "Laptop, impresora, vehículo, instrumental, etc. Detallá marca/modelo/serie y estado." },
      { key: "s4_corp_email", label: "Correo corporativo asignado (indicar correo y si tiene acceso)", kind: "text", store: "survey" },
      { key: "s4_credentials", label: "Credenciales / usuarios / accesos a sistemas, bancos, plataformas, redes, facturación", kind: "textarea", store: "survey", help: "NO escriba contraseñas." },
      { key: "s4_keys", label: "Llaves, tarjetas de acceso, sellos, talonarios, documentos o carpetas a su cargo", kind: "textarea", store: "survey" },
      { key: "s4_uniform_items", label: "Uniforme, credencial, maletín, material/instrumental, catálogos u otros bienes", kind: "textarea", store: "survey" },
      { key: "s4_additional", label: "¿Qué equipos/accesos/herramientas adicionales necesita?", kind: "textarea", store: "survey" },
      { key: "s4_regularize", label: "¿Algún equipo/acceso/material a actualizar, bloquear, regularizar o reasignar?", kind: "textarea", store: "survey" },
      { key: "s4_uniform_ok", label: "¿Tiene uniforme o indumentaria adecuada?", kind: "yesno", store: "survey" },
      { key: "s4_workplace_ok", label: "¿El lugar donde trabaja es adecuado?", kind: "yesno", store: "survey" },
      { key: "s4_workload_ok", label: "¿Considera que su carga laboral es adecuada?", kind: "yesno", store: "survey" },
      { key: "s4_tasks_out", label: "¿Realiza tareas que no corresponden a su cargo? ¿Cuáles?", kind: "textarea", store: "survey" },
      { key: "s4_reorg", label: "¿Qué tareas deberían reorganizarse?", kind: "textarea", store: "survey" },
      { key: "s4_facilitate", label: "¿Qué necesita implementar la empresa para facilitar su trabajo?", kind: "textarea", store: "survey" },
      { key: "s4_security", label: "¿Qué aspectos de seguridad, orden o control deberían mejorarse?", kind: "textarea", store: "survey" },
    ],
  },
  {
    id: 5,
    title: "Satisfacción, ambiente laboral y comunicación",
    fields: [
      { key: "s5_conforme", label: "¿Se siente conforme trabajando en la empresa?", kind: "yesno", store: "survey" },
      { key: "s5_valora", label: "¿Qué es lo que más valora de trabajar en D.M.O. S.R.L.?", kind: "textarea", store: "survey" },
      { key: "s5_positivos", label: "Aspectos positivos que identifica dentro de la empresa", kind: "textarea", store: "survey" },
      { key: "s5_negativos", label: "Aspectos negativos que considera deben corregirse", kind: "textarea", store: "survey" },
      { key: "s5_trato", label: "¿Cómo califica el trato que recibe de sus superiores?", kind: "select", store: "survey", options: RATING },
      { key: "s5_comunicacion", label: "¿Cómo califica la comunicación con su jefe inmediato?", kind: "select", store: "survey", options: RATING },
      { key: "s5_companeros", label: "¿Cómo califica la relación con sus compañeros?", kind: "select", store: "survey", options: RATING },
      { key: "s5_escuchado", label: "¿Se siente escuchado cuando realiza una sugerencia?", kind: "yesno", store: "survey" },
      { key: "s5_reconocido", label: "¿Considera que la empresa reconoce su esfuerzo?", kind: "yesno", store: "survey" },
      { key: "s5_armonia", label: "¿Qué se podría hacer para mejorar la armonía laboral?", kind: "textarea", store: "survey" },
      { key: "s5_urgentes", label: "¿Qué cambios considera urgentes para mejorar el ambiente laboral?", kind: "textarea", store: "survey" },
    ],
  },
  {
    id: 6,
    title: "Organización, control y propuestas de mejora",
    fields: [
      { key: "s6_reporta", label: "¿A quién debe reportar sus actividades?", kind: "text", store: "survey" },
      { key: "s6_informes", label: "¿Entrega informes diarios, semanales o mensuales? ¿Cuáles?", kind: "textarea", store: "survey" },
      { key: "s6_controles", label: "¿Qué controles deberían implementarse en su área?", kind: "textarea", store: "survey" },
      { key: "s6_documentos", label: "¿Qué documentos o información maneja en su puesto?", kind: "textarea", store: "survey" },
      { key: "s6_archivo", label: "¿Qué información debería estar mejor archivada o respaldada?", kind: "textarea", store: "survey" },
      { key: "s6_riesgos", label: "¿Qué riesgos observa en su área de trabajo?", kind: "textarea", store: "survey" },
      { key: "s6_orden", label: "Sugerencias para mejorar el orden interno", kind: "textarea", store: "survey" },
      { key: "s6_coordinacion", label: "Sugerencias para mejorar la coordinación entre áreas", kind: "textarea", store: "survey" },
      { key: "s6_comodo", label: "¿Qué puede hacer la empresa para que trabaje mejor y se sienta más cómodo?", kind: "textarea", store: "survey" },
    ],
  },
  {
    id: 7,
    title: "Compromiso y proyección dentro de la empresa",
    fields: [
      { key: "s7_continue", label: "¿Desea continuar trabajando en la empresa?", kind: "yesno", store: "survey", required: true },
      { key: "s7_crecer", label: "¿En qué área le gustaría crecer?", kind: "text", store: "survey" },
      { key: "s7_cargo", label: "¿Qué cargo o función le gustaría ocupar a futuro?", kind: "text", store: "survey" },
      { key: "s7_capacitaciones", label: "¿Está dispuesto a recibir capacitaciones?", kind: "yesno", store: "survey" },
      { key: "s7_responsabilidades", label: "¿Está dispuesto a asumir nuevas responsabilidades?", kind: "yesno", store: "survey" },
      { key: "s7_habilidades", label: "¿Qué habilidades considera que puede aportar más a la empresa?", kind: "textarea", store: "survey" },
      { key: "s7_espera", label: "¿Qué espera de la empresa a futuro?", kind: "textarea", store: "survey" },
      { key: "s7_compromiso", label: "¿Qué compromiso personal asume para mejorar su desempeño?", kind: "textarea", store: "survey" },
      { key: "s7_mensaje", label: "Mensaje final o comentario que desee hacer llegar a Gerencia", kind: "textarea", store: "survey" },
    ],
  },
];

export const ALL_FIELDS: Field[] = SECTIONS.flatMap((s) => s.fields);

// Columnas de employee_records escribibles desde el formulario (whitelist).
export const COLUMN_FIELDS = ALL_FIELDS.filter((f) => f.store === "column");
export const SURVEY_FIELDS = ALL_FIELDS.filter((f) => f.store === "survey");

// Columnas booleanas (yes/no) y de fecha, para castear al guardar.
export const BOOLEAN_COLUMNS = COLUMN_FIELDS.filter((f) => f.kind === "yesno").map((f) => f.key);
export const DATE_COLUMNS = COLUMN_FIELDS.filter((f) => f.kind === "date").map((f) => f.key);

// ¿Un campo está visible según sus dependencias? (respeta dependsOn)
export function isFieldActive(field: Field, values: Record<string, unknown>): boolean {
  if (!field.dependsOn) return true;
  const current = values[field.dependsOn.key];
  return current === field.dependsOn.equals;
}

// Valida los campos obligatorios activos. Devuelve la lista de labels faltantes.
export function missingRequired(
  columns: Record<string, unknown>,
  survey: Record<string, string>,
): string[] {
  const missing: string[] = [];
  for (const f of ALL_FIELDS) {
    if (!f.required) continue;
    const values = f.store === "survey" ? survey : columns;
    if (!isFieldActive(f, { ...columns, ...survey })) continue;
    const v = values[f.key];
    const empty = v === null || v === undefined || (typeof v === "string" && v.trim() === "");
    if (empty) missing.push(f.label);
  }
  return missing;
}
