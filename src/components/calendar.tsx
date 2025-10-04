"use client";

import { useEffect, useRef } from "react";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import { Card } from "@/components/ui/card";
import { useCalendarData } from "@/lib/hooks/useCalendarData";

interface FullCalendarComponentProps {
  className?: string;
  usuarioId?: number;
}

export default function FullCalendarComponent({
  className = "",
  usuarioId,
}: FullCalendarComponentProps) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarInstance = useRef<Calendar | null>(null);
  const { events, loading, error, refreshData } = useCalendarData(usuarioId!);

  useEffect(() => {
    if (!calendarRef.current || loading) return;

    const calendar = new Calendar(calendarRef.current, {
      plugins: [
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin,
        listPlugin,
        multiMonthPlugin,
      ],

      initialView: "dayGridMonth",

      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
      },

      height: "auto",

      locale: "pt-br",

      buttonText: {
        today: "Hoje",
        month: "Mês",
        week: "Semana",
        day: "Dia",
        list: "Lista",
      },

      weekends: true,
      navLinks: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,

      slotMinTime: "08:00:00",
      slotMaxTime: "19:00:00",
      slotDuration: "00:30:00",

      businessHours: {
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: "09:00",
        endTime: "18:00",
      },

      events: events,

      dateClick: function (info) {
        console.log("Data clicada:", info.dateStr);
      },

      eventClick: function (info) {
        console.log("Evento clicado:", info.event);
        const event = info.event;
        const props = event.extendedProps;

        let detailsHtml = `
          <strong>Tipo:</strong> ${
            props.type === "despesa" ? "Despesa" : "Receita"
          }<br>
          <strong>Título:</strong> ${event.title}<br>
          <strong>Data:</strong> ${event.start?.toLocaleDateString("pt-BR")}<br>
          <strong>Categoria:</strong> ${props.categoria}<br>
          <strong>Status:</strong> ${props.status}<br>
          <strong>Valor:</strong> R$ ${props.valor?.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}<br>
        `;

        if (props.observacoes) {
          detailsHtml += `<strong>Observações:</strong> ${props.observacoes}<br>`;
        }

        const modal = document.createElement("div");
        modal.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
              <h3 style="margin-top: 0; color: #1f2937;">Detalhes do ${
                props.type === "despesa" ? "Despesa" : "Receita"
              }</h3>
              <div style="margin: 15px 0; line-height: 1.6;">${detailsHtml}</div>
              <button onclick="this.closest('div').parentElement.remove()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Fechar</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        info.jsEvent.preventDefault();
      },

      select: function (info) {
        console.log("Período selecionado:", info);
        alert(`Data selecionada: ${info.start.toLocaleDateString("pt-BR")}`);
        calendar.unselect();
      },

      eventDidMount: function (info) {
        const props = info.event.extendedProps;
        const tooltip = `${props.type === "despesa" ? "Despesa" : "Receita"}: ${
          info.event.title
        } - R$ ${props.valor?.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}`;
        info.el.setAttribute("title", tooltip);
      },

      weekNumbers: true,
      weekText: "Sem",
      allDayText: "Todo dia",
      moreLinkText: "mais",
      noEventsText: "Nenhum evento para exibir",

      views: {
        dayGridMonth: {
          titleFormat: { year: "numeric", month: "long" },
        },
        timeGridWeek: {
          titleFormat: { year: "numeric", month: "short", day: "numeric" },
        },
        timeGridDay: {
          titleFormat: { year: "numeric", month: "long", day: "numeric" },
        },
      },
    });

    calendar.render();
    calendarInstance.current = calendar;

    return () => {
      if (calendarInstance.current) {
        calendarInstance.current.destroy();
        calendarInstance.current = null;
      }
    };
  }, [events, loading]);

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Calendário Financeiro
            </h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Despesas</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="text-red-600">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro ao carregar dados
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={refreshData}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="w-full">
            {loading ? (
              <div className="min-h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Carregando calendário...</p>
                </div>
              </div>
            ) : (
              <div
                ref={calendarRef}
                className="w-full min-h-[600px] [&_.fc]:font-sans
                                         [&_.fc-toolbar]:mb-4 flex flex-row
                                         [&_.fc-toolbar-title]:text-xl [&_.fc-toolbar-title]:font-semibold [&_.fc-toolbar-title]:text-gray-900
                                         [&_.fc-button]:bg-blue-600 [&_.fc-button]:border-blue-600 [&_.fc-button]:text-white
                                         [&_.fc-button]:font-medium [&_.fc-button]:rounded-md [&_.fc-button]:px-4 [&_.fc-button]:py-2
                                         [&_.fc-button:hover]:bg-blue-700 [&_.fc-button:hover]:border-blue-700
                                         [&_.fc-button:focus]:ring-2 [&_.fc-button:focus]:ring-blue-500 [&_.fc-button:focus]:ring-opacity-50
                                         [&_.fc-button-active]:bg-blue-800 [&_.fc-button-active]:border-blue-800
                                         [&_.fc-event]:rounded [&_.fc-event]:border-0 [&_.fc-event]:font-medium [&_.fc-event]:text-sm
                                         [&_.fc-event:hover]:opacity-80 [&_.fc-event:hover]:cursor-pointer
                                         [&_.fc-daygrid-event]:m-0.5 [&_.fc-daygrid-event]:px-1 [&_.fc-daygrid-event]:py-0.5
                                         [&_.fc-timegrid-event]:rounded
                                         [&_.fc-day-today]:bg-blue-50
                                         [&_.fc-scrollgrid]:border-gray-200
                                         [&_.fc-scrollgrid_td]:border-gray-200 [&_.fc-scrollgrid_th]:border-gray-200
                                         [&_.fc-col-header-cell]:bg-gray-50 [&_.fc-col-header-cell]:font-semibold [&_.fc-col-header-cell]:text-gray-700
                                         [&_.fc-daygrid-day-number]:text-gray-700 [&_.fc-daygrid-day-number]:font-medium
                                         [&_.fc-more-link]:text-blue-600 [&_.fc-more-link]:font-medium
                                         [&_.fc-more-link:hover]:text-blue-700"
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
