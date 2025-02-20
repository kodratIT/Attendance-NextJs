// MUI Imports
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';

// Third Party Imports
import type { Table } from '@tanstack/react-table';

interface TablePaginationProps<T> {
  table: Table<T>;
}

const TablePaginationComponent = <T,>({ table }: TablePaginationProps<T>) => {
  // Destructuring pagination state
  const {
    pageIndex,
    pageSize
  } = table.getState().pagination;

  const totalRows = table.getFilteredRowModel().rows.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
      <Typography color='text.disabled'>
        {`Menampilkan ${startRow} hingga ${endRow} dari ${totalRows} entri`}
      </Typography>
      <Pagination
        shape='rounded'
        color='primary'
        variant='tonal'
        count={totalPages}
        page={pageIndex + 1}
        onChange={(_, page) => table.setPageIndex(page - 1)}
        showFirstButton
        showLastButton
      />
    </div>
  );
};

export default TablePaginationComponent;
