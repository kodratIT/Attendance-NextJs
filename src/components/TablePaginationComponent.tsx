// MUI Imports
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';

// Local Types
interface TablePaginationProps {
  pageIndex: number;
  pageSize: number;
  rowCount: number;
  onPageChange: (event: React.ChangeEvent<unknown>, pageIndex: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TablePaginationComponent = ({
  pageIndex,
  pageSize,
  rowCount,
  onPageChange,
}: TablePaginationProps) => {
  const safePageSize = pageSize > 0 ? pageSize : 10;
  const totalRows = Math.max(0, rowCount || 0);
  const totalPages = Math.max(1, Math.ceil(totalRows / safePageSize));
  const safePageIndex = Math.min(Math.max(0, pageIndex || 0), totalPages - 1);

  const startRow = totalRows === 0 ? 0 : safePageIndex * safePageSize + 1;
  const endRow = Math.min((safePageIndex + 1) * safePageSize, totalRows);

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
        page={safePageIndex + 1}
        onChange={(event, page) => onPageChange(event as any, page - 1)}
        showFirstButton
        showLastButton
      />
    </div>
  );
};

export default TablePaginationComponent;
