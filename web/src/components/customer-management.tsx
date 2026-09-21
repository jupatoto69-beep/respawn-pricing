"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Customer, CustomerInput } from "@/lib/customers/customer";
import {
  createSupabaseCustomerRepository,
  type CustomerRepository,
} from "@/lib/customers/customer-repository";
import { filterCustomers } from "@/lib/customers/customer-search";
import {
  validateCustomerInput,
  type CustomerValidationErrors,
} from "@/lib/customers/customer-validation";
import {
  DEFAULT_PHONE_COUNTRY_ISO2,
  isPhoneCountryIso2,
  PHONE_COUNTRY_DEFINITIONS,
} from "@/lib/pricing/phone-country-catalog";
import { isCustomerPhoneNumberInput } from "@/lib/pricing/temporary-quotation-details-validation";
import { createClient } from "@/lib/supabase/client";

import styles from "./customer-management.module.css";

type CustomerManagementProps = Readonly<{
  onSelectCustomer: (customer: Customer) => void;
}>;

type EditorState =
  | Readonly<{ mode: "closed" }>
  | Readonly<{ mode: "create" }>
  | Readonly<{ mode: "edit"; customerId: string }>;

type Feedback = Readonly<{
  kind: "success" | "error";
  message: string;
}>;

const EMPTY_INPUT: CustomerInput = Object.freeze({
  name: "",
  document: "",
  phoneCountryIso2: DEFAULT_PHONE_COUNTRY_ISO2,
  phoneNumber: "",
  email: "",
  city: "",
});

function inputFromCustomer(customer: Customer): CustomerInput {
  return {
    name: customer.name,
    document: customer.document ?? "",
    phoneCountryIso2:
      customer.phoneCountryIso2 ?? DEFAULT_PHONE_COUNTRY_ISO2,
    phoneNumber: customer.phoneNumber ?? "",
    email: customer.email ?? "",
    city: customer.city ?? "",
  };
}

function sortCustomers(customers: readonly Customer[]): readonly Customer[] {
  return [...customers].sort((left, right) =>
    left.name.localeCompare(right.name, "es-CO"),
  );
}

export function CustomerManagement({
  onSelectCustomer,
}: CustomerManagementProps) {
  const idPrefix = useId();
  const repositoryRef = useRef<CustomerRepository | null>(null);
  const [customers, setCustomers] = useState<readonly Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [input, setInput] = useState<CustomerInput>(EMPTY_INPUT);
  const [errors, setErrors] = useState<CustomerValidationErrors>({});

  function getRepository(): CustomerRepository {
    repositoryRef.current ??= createSupabaseCustomerRepository(createClient());
    return repositoryRef.current;
  }

  useEffect(() => {
    let isActive = true;

    async function loadCustomers() {
      try {
        const result = await getRepository().list();

        if (!isActive) {
          return;
        }

        if (!result.ok) {
          setLoadError(result.message);
          return;
        }

        setCustomers(result.value);
        setLoadError(null);
      } catch {
        if (isActive) {
          setLoadError("No pudimos cargar los clientes. Inténtalo de nuevo.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      isActive = false;
    };
  }, []);

  const visibleCustomers = useMemo(
    () => filterCustomers(customers, query),
    [customers, query],
  );

  function openCreate() {
    setEditor({ mode: "create" });
    setInput(EMPTY_INPUT);
    setErrors({});
    setFeedback(null);
  }

  function openEdit(customer: Customer) {
    setEditor({ mode: "edit", customerId: customer.id });
    setInput(inputFromCustomer(customer));
    setErrors({});
    setFeedback(null);
  }

  function closeEditor() {
    setEditor({ mode: "closed" });
    setErrors({});
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const field = event.currentTarget.name as keyof CustomerInput;
    const value = event.currentTarget.value;

    if (field === "phoneCountryIso2") {
      if (!isPhoneCountryIso2(value)) {
        return;
      }

      setInput((current) => ({ ...current, phoneCountryIso2: value }));
      return;
    }

    if (field === "phoneNumber" && !isCustomerPhoneNumberInput(value)) {
      return;
    }

    setInput((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateCustomerInput(input);
    setErrors(validationErrors);
    setFeedback(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      const repository = getRepository();
      const result =
        editor.mode === "edit"
          ? await repository.update(editor.customerId, input)
          : await repository.create(input);

      if (!result.ok) {
        setFeedback({ kind: "error", message: result.message });
        return;
      }

      setCustomers((current) =>
        sortCustomers(
          editor.mode === "edit"
            ? current.map((customer) =>
                customer.id === result.value.id ? result.value : customer,
              )
            : [...current, result.value],
        ),
      );
      setFeedback({
        kind: "success",
        message:
          editor.mode === "edit"
            ? "Cliente actualizado. La cotización actual no cambió; selecciónalo de nuevo para recargar sus datos."
            : "Cliente guardado correctamente.",
      });
      setEditor({ mode: "closed" });
      setErrors({});
    } catch {
      setFeedback({
        kind: "error",
        message:
          editor.mode === "edit"
            ? "No pudimos actualizar el cliente. Inténtalo de nuevo."
            : "No pudimos guardar el cliente. Inténtalo de nuevo.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleSelect(customer: Customer) {
    onSelectCustomer(customer);
    setFeedback({
      kind: "success",
      message: `Los datos actuales de ${customer.name} se copiaron a la cotización.`,
    });
  }

  const editorTitle =
    editor.mode === "edit" ? "Editar cliente" : "Nuevo cliente";

  return (
    <section className={styles.container} aria-labelledby={`${idPrefix}-title`}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>Directorio compartido</p>
          <h3 id={`${idPrefix}-title`}>Clientes</h3>
        </div>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={openCreate}
        >
          Nuevo cliente
        </button>
      </div>

      <label className={styles.searchField} htmlFor={`${idPrefix}-search`}>
        Buscar por nombre, documento, teléfono o correo
        <input
          id={`${idPrefix}-search`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Buscar clientes"
        />
      </label>

      {loadError ? (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      ) : isLoading ? (
        <p className={styles.status}>Cargando clientes…</p>
      ) : visibleCustomers.length === 0 ? (
        <p className={styles.emptyState}>
          {customers.length === 0
            ? "Aún no hay clientes guardados."
            : "No encontramos clientes con esa búsqueda."}
        </p>
      ) : (
        <ul className={styles.customerList}>
          {visibleCustomers.map((customer) => (
            <li key={customer.id} className={styles.customerItem}>
              <div>
                <strong>{customer.name}</strong>
                <span>
                  {customer.document ??
                    customer.email ??
                    customer.phoneNumber ??
                    "Sin datos adicionales"}
                </span>
              </div>
              <div className={styles.itemActions}>
                <button type="button" onClick={() => handleSelect(customer)}>
                  Usar en cotización
                </button>
                <button type="button" onClick={() => openEdit(customer)}>
                  Editar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editor.mode !== "closed" ? (
        <form className={styles.editor} onSubmit={handleSubmit} noValidate>
          <div className={styles.editorHeading}>
            <h4>{editorTitle}</h4>
            <button type="button" onClick={closeEditor} disabled={isSaving}>
              Cancelar
            </button>
          </div>

          <div className={styles.fields}>
            <label>
              Nombre o empresa <span aria-hidden="true">*</span>
              <input
                name="name"
                value={input.name}
                onChange={handleInputChange}
                aria-invalid={errors.name ? true : undefined}
                disabled={isSaving}
              />
              {errors.name ? <small role="alert">{errors.name}</small> : null}
            </label>
            <label>
              Documento o NIT
              <input
                name="document"
                value={input.document}
                onChange={handleInputChange}
                aria-invalid={errors.document ? true : undefined}
                disabled={isSaving}
              />
              {errors.document ? (
                <small role="alert">{errors.document}</small>
              ) : null}
            </label>
            <label>
              País del teléfono
              <select
                name="phoneCountryIso2"
                value={input.phoneCountryIso2}
                onChange={handleInputChange}
                disabled={isSaving}
              >
                {PHONE_COUNTRY_DEFINITIONS.map((country) => (
                  <option key={country.iso2} value={country.iso2}>
                    {country.name} ({country.callingCode})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Teléfono
              <input
                name="phoneNumber"
                inputMode="numeric"
                value={input.phoneNumber}
                onChange={handleInputChange}
                aria-invalid={errors.phoneNumber ? true : undefined}
                disabled={isSaving}
              />
              {errors.phoneNumber ? (
                <small role="alert">{errors.phoneNumber}</small>
              ) : null}
            </label>
            <label>
              Correo electrónico
              <input
                name="email"
                type="email"
                value={input.email}
                onChange={handleInputChange}
                aria-invalid={errors.email ? true : undefined}
                disabled={isSaving}
              />
              {errors.email ? <small role="alert">{errors.email}</small> : null}
            </label>
            <label>
              Ciudad
              <input
                name="city"
                value={input.city}
                onChange={handleInputChange}
                aria-invalid={errors.city ? true : undefined}
                disabled={isSaving}
              />
              {errors.city ? <small role="alert">{errors.city}</small> : null}
            </label>
          </div>

          <button className={styles.saveButton} type="submit" disabled={isSaving}>
            {isSaving ? "Guardando…" : "Guardar cliente"}
          </button>
        </form>
      ) : null}

      {feedback ? (
        <p
          className={feedback.kind === "error" ? styles.error : styles.feedback}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
