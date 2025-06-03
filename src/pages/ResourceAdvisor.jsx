// cloud-cost-dashboard-frontend/src/pages/ResourceAdvisor.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 20; // Fewer items per page for resource view as rows can be wider

const ResourceAdvisor = ({ parsedCsvData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('');
  const [showIdleOnly, setShowIdleOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'totalCost', direction: 'descending' });

  // Memoize the processed resources to avoid re-calculation on every render
  const allResources = useMemo(() => {
    if (!parsedCsvData || parsedCsvData.length === 0) return [];

    const resourceUsage = {};
    parsedCsvData.forEach(row => {
      const cost = parseFloat(row.lineItemUnblendedCost) || 0;
      const service = row.productProductFamily || row.productServiceCode || 'Unknown Service';
      const resourceId = row.lineItemResourceId || null;
      const usageType = row.lineItemUsageType || 'Unknown UsageType';
      const usageStartDate = row.lineItemUsageStartDate;

      if (cost > 0 && resourceId) {
        if (!resourceUsage[resourceId]) {
          resourceUsage[resourceId] = {
            totalCost: 0,
            service: service,
            usageTypes: new Set(),
            firstSeen: usageStartDate ? new Date(usageStartDate) : null,
            lastSeen: usageStartDate ? new Date(usageStartDate) : null,
            occurrences: 0
          };
        }
        resourceUsage[resourceId].totalCost += cost;
        resourceUsage[resourceId].usageTypes.add(usageType);
        resourceUsage[resourceId].occurrences++;

        if (usageStartDate) {
          const currentDate = new Date(usageStartDate);
          if (resourceUsage[resourceId].firstSeen === null || currentDate < resourceUsage[resourceId].firstSeen) {
              resourceUsage[resourceId].firstSeen = currentDate;
          }
          if (resourceUsage[resourceId].lastSeen === null || currentDate > resourceUsage[resourceId].lastSeen) {
              resourceUsage[resourceId].lastSeen = currentDate;
          }
        }
      }
    });

    return Object.entries(resourceUsage).map(([id, details]) => {
      const durationDays = (details.firstSeen && details.lastSeen)
        ? Math.ceil(Math.abs(details.lastSeen - details.firstSeen) / (1000 * 60 * 60 * 24)) + 1
        : 0;

      return {
        resourceId: id,
        service: details.service,
        totalCost: details.totalCost,
        usageTypes: Array.from(details.usageTypes).join(', '),
        occurrences: details.occurrences,
        durationDays: durationDays,
        isIdle: (details.totalCost < 5 && details.occurrences < 5 && durationDays > 10) // Criteria for idle
      };
    }).filter(r => r.totalCost > 0); // Only include resources with positive cost
  }, [parsedCsvData]);

  // Apply filters and sorting
  const filteredAndSortedResources = useMemo(() => {
    let filtered = allResources.filter(resource => {
      const matchesSearch = searchTerm === '' ||
                            resource.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            resource.service.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService = filterService === '' || resource.service === filterService;
      const matchesIdle = !showIdleOnly || resource.isIdle;
      return matchesSearch && matchesService && matchesIdle;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [allResources, searchTerm, filterService, showIdleOnly, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedResources.length / ITEMS_PER_PAGE);

  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedResources.slice(startIndex, endIndex);
  }, [currentPage, filteredAndSortedResources]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };

  // Get unique services for the filter dropdown
  const uniqueServices = useMemo(() => {
    const services = new Set();
    allResources.forEach(res => services.add(res.service));
    return ['All Services', ...Array.from(services).sort()];
  }, [allResources]);


  if (!parsedCsvData || parsedCsvData.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Resource Advisor</h2>
        <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No CSV Data Found!</strong>
          <span className="block sm:inline ml-2">Please upload your AWS Billing CSV on the <Link to="/upload" className="font-semibold underline">Upload CSV page</Link> to analyze resources.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Resource Advisor</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Identify and analyze individual AWS resources for cost optimization opportunities.
      </p>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Search by ID or Service..."
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex-grow max-w-xs"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
        <select
          value={filterService}
          onChange={(e) => { setFilterService(e.target.value === 'All Services' ? '' : e.target.value); setCurrentPage(1); }}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {uniqueServices.map(service => (
            <option key={service} value={service}>{service}</option>
          ))}
        </select>
        <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={showIdleOnly}
            onChange={(e) => { setShowIdleOnly(e.target.checked); setCurrentPage(1); }}
            className="form-checkbox h-5 w-5 text-blue-600 rounded-md"
          />
          <span>Show Potentially Idle Only</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('resourceId')}>
                Resource ID {getSortIndicator('resourceId')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('service')}>
                Service {getSortIndicator('service')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('totalCost')}>
                Total Cost ($) {getSortIndicator('totalCost')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Usage Types
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('occurrences')}>
                Occurrences {getSortIndicator('occurrences')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('durationDays')}>
                Duration (Days) {getSortIndicator('durationDays')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Idle?
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentTableData.length > 0 ? (
              currentTableData.map((resource, index) => (
                <tr key={resource.resourceId || index} className={resource.isIdle ? 'bg-yellow-50 dark:bg-yellow-950' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {resource.resourceId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {resource.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${resource.totalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs overflow-hidden text-ellipsis">
                    {resource.usageTypes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {resource.occurrences}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {resource.durationDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {resource.isIdle ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No resources match your current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedResources.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourceAdvisor;
